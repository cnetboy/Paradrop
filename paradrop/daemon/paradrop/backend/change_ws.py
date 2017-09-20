import json

from autobahn.twisted.websocket import WebSocketServerProtocol
from autobahn.twisted.websocket import WebSocketServerFactory

from paradrop.base.output import out


class ChangeStreamProtocol(WebSocketServerProtocol):
    def __init__(self, factory):
        WebSocketServerProtocol.__init__(self)
        self.factory = factory

    def onOpen(self):
        self.factory.update.add_message_observer(self)
        for msg in self.factory.update.messages:
            self.sendMessage(json.dumps(msg))

    def on_message(self, data):
        self.sendMessage(json.dumps(data))

    def onClose(self, wasClean, code, reason):
        self.factory.update.remove_message_observer(self)


class ChangeStreamFactory(WebSocketServerFactory):
    def __init__(self, update, *args, **kwargs):
        WebSocketServerFactory.__init__(self, *args, **kwargs)
        self.update = update

    def buildProtocol(self, addr):
        return ChangeStreamProtocol(self)
