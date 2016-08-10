import heapq
import ipaddress
import os
import random
import string
import subprocess
from pprint import pprint

from pdtools.lib.output import out
from paradrop.lib.utils import pdosq

from .base import ConfigObject
from .command import Command, KillCommand


def isHexString(data):
    """
    Test if a string contains only hex digits.
    """
    return all(c in string.hexdigits for c in data)


class ConfigWifiDevice(ConfigObject):
    typename = "wifi-device"

    options = [
        {"name": "type", "type": str, "required": True, "default": None},
        {"name": "channel", "type": int, "required": True, "default": 1}
    ]


class ConfigWifiIface(ConfigObject):
    typename = "wifi-iface"

    options = [
        {"name": "device", "type": str, "required": True, "default": None},
        {"name": "mode", "type": str, "required": True, "default": "ap"},
        {"name": "ssid", "type": str, "required": True, "default": "Paradrop"},
        {"name": "network", "type": str, "required": True, "default": "lan"},
        {"name": "encryption", "type": str, "required": False, "default": None},
        {"name": "key", "type": str, "required": False, "default": None},

        # NOTE: ifname is not defined in the UCI specs.  We use it to declare a
        # desired name for the virtual wireless interface that should be
        # created.
        {"name": "ifname", "type": str, "required": False, "default": None}
    ]

    def apply(self, allConfigs):
        commands = list()

        if self.mode == "ap":
            pass
        elif self.mode == "sta":
            # TODO: Implement "sta" mode.

            # We only need to set the channel in "sta" mode.  In "ap" mode,
            # hostapd will take care of it.
            #cmd = ["iw", "dev", wifiDevice.name, "set", "channel",
            #       str(wifiDevice.channel)]

            #commands.append(Command(cmd, self))
            raise Exception("WiFi sta mode not implemented")
        else:
            raise Exception("Unsupported mode ({}) in {}".format(
                self.mode, str(self)))

        # Look up the wifi-device section.
        wifiDevice = self.lookup(allConfigs, "wifi-device", self.device)

        # Look up the interface section.
        interface = self.lookup(allConfigs, "interface", self.network)

        self.isVirtual = True

        # Make this private variable because the real option variable (ifname)
        # should really be read-only.  Changing it breaks our equality checks.
        self._ifname = self.ifname

        if self.ifname == wifiDevice.name:
            # This interface is using the physical device directly (eg. wlan0).
            # This case is when the configuration specified the ifname option.
            self.isVirtual = False

            cmd = ["iw", "dev", wifiDevice.name, "set", "type", "__ap"]
            commands.append((self.PRIO_CONFIG_IFACE, Command(cmd, self)))

        elif interface.config_ifname == wifiDevice.name:
            # This interface is using the physical device directly (eg. wlan0).
            # TODO: Remove this case if it is not used.
            self._ifname = interface.config_ifname
            self.isVirtual = False

            cmd = ["iw", "dev", wifiDevice.name, "set", "type", "__ap"]
            commands.append((self.PRIO_CONFIG_IFACE, Command(cmd, self)))

        elif self.ifname is None:
            # This interface is a virtual one (eg. foo.wlan0 using wlan0).  Get
            # the virtual interface name from the network it's attached to.
            # This is unusual behavior which may be dropped in favor of
            # generating a name here.
            self._ifname = interface.config_ifname

        if self.isVirtual:
            # Command to create the virtual interface.
            cmd = ["iw", "dev", wifiDevice.name, "interface", "add",
                   self._ifname, "type", "__ap"]
            commands.append((self.PRIO_CREATE_IFACE, Command(cmd, self)))

            # Assign a random MAC address to avoid conflict with other
            # interfaces using the same device.
            cmd = ["ip", "link", "set", "dev", self._ifname,
                    "address", self.getRandomMAC()]
            commands.append((self.PRIO_CREATE_IFACE, Command(cmd, self)))

        confFile = self.makeHostapdConf(wifiDevice, interface)

        self.pidFile = "{}/hostapd-{}.pid".format(
            self.manager.writeDir, self.internalName)

        cmd = ["/apps/bin/hostapd", "-P", self.pidFile, "-B", confFile]
        commands.append((self.PRIO_START_DAEMON, Command(cmd, self)))

        return commands

    def makeHostapdConf(self, wifiDevice, interface):
        outputPath = "{}/hostapd-{}.conf".format(
            self.manager.writeDir, self.internalName)
        with open(outputPath, "w") as outputFile:
            # Write our informative header block.
            outputFile.write("#" * 80 + "\n")
            outputFile.write("# hostapd configuration file generated by "
                             "pdconfd\n")
            outputFile.write("# Source: {}\n".format(self.source))
            outputFile.write("# Section: {}\n".format(str(self)))
            outputFile.write("# Device: {}\n".format(str(wifiDevice)))
            outputFile.write("# Interface: {}\n".format(str(interface)))
            outputFile.write("#" * 80 + "\n")
            # 802.11ac not working, need to find out why
            outputFile.write("hw_mode=g\n")
            #outputFile.write("ieee80211ac=1\n")

            # Write essential options.
            outputFile.write("interface={}\n".format(self._ifname))
            outputFile.write("ssid={}\n".format(self.ssid))
            outputFile.write("channel={}\n".format(wifiDevice.channel))

            if interface.type == "bridge":
                outputFile.write("bridge={}\n".format(interface.config_ifname))

            # Optional encryption options.
            if self.encryption is None or self.encryption == "none":
                pass
            elif self.encryption == "psk2":
                outputFile.write("wpa=1\n")
                # If key is a 64 character hex string, then treat it as the PSK
                # directly, else treat it as a passphrase.
                if len(self.key) == 64 and isHexString(self.key):
                    outputFile.write("wpa_psk={}\n".format(self.key))
                else:
                    outputFile.write("wpa_passphrase={}\n".format(self.key))
            else:
                out.warn("Encryption type {} not supported (supported: "
                         "none|psk2)".format(self.encryption))
                raise Exception("Encryption type not supported")
        return outputPath

    def revert(self, allConfigs):
        commands = list()

        commands.append((-self.PRIO_START_DAEMON,
            KillCommand(self.pidFile, self)))

        # Delete our virtual interface.
        if self.isVirtual:
            cmd = ["iw", "dev", self._ifname, "del"]
            commands.append((-self.PRIO_CREATE_IFACE, Command(cmd, self)))

        return commands

    def updateApply(self, new, allConfigs):
        if new.mode != self.mode or \
                new.device != self.device or \
                new.network != self.network:
            # Major change requires unloading the old section and applying the
            # new.
            return self.apply(allConfigs)

        commands = list()

        if new.mode == "ap":
            # Look up the wifi-device section.
            wifiDevice = new.lookup(allConfigs, "wifi-device", new.device)

            # Look up the interface section.
            interface = new.lookup(allConfigs, "interface", new.network)

            confFile = new.makeHostapdConf(wifiDevice, interface)

            new.pidFile = "{}/hostapd-{}.pid".format(
                new.manager.writeDir, self.internalName)

            cmd = ["/apps/bin/hostapd", "-P", new.pidFile, "-B", confFile]
            commands.append((self.PRIO_START_DAEMON, Command(cmd, new)))

        return commands

    def updateRevert(self, new, allConfigs):
        if new.mode != self.mode or \
                new.device != self.device or \
                new.network != self.network:
            # Major change requires unloading the old section and applying the
            # new.
            return self.revert(allConfigs)

        commands = list()

        if self.mode == "ap":
            # Bring down hostapd
            commands.append((-self.PRIO_START_DAEMON,
                KillCommand(self.pidFile, self)))

        return commands

    def getRandomMAC(self):
        """
        Generate a random MAC address.

        Returns a string "02:xx:xx:xx:xx:xx".  The first byte is 02, which
        indicates a locally administered address.
        """
        parts = ["02"]
        for i in range(5):
            parts.append("{:02x}".format(random.randrange(0, 255)))
        return ":".join(parts)
