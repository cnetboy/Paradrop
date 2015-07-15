'''
Storage and stateful functionality for tools and paradrop. 

Holds onto the following things:
    Keys
    Identity
    Logs 
        Not really, Twisted is handling this-- we just make the directory here
'''

import os
import yaml


# LOG_NAME = 'log.txt'

# Check and see if we're on snappy or not. If not, then stick the logs in the local
# directory. We will be provisioned as a developer instance anyway, so the info doesn't matter yet,
# Also doesn't really matter for the buildtools, although it is a bit of a vulnurability
snappyPath = os.getenv("SNAP_APP_USER_DATA_PATH", None)

STORE_PATH = snappyPath + '/' if snappyPath is not None else '~/.paradrop/instance'

LOG_PATH = STORE_PATH + 'logs/'
KEY_PATH = STORE_PATH + 'keys/'
INFO_PATH = STORE_PATH + 'root.yaml'

# Keys required in the store
INFO_REQUIRES = ['version', 'accounts', 'currentAccount']


class Store(object):

    def __init__(self):

        # Create needed directories
        for path in [STORE_PATH, KEY_PATH, LOG_PATH]:
            if not os.path.exists(path):
                os.makedirs(path)

        # No config file found. Create a default one
        if not os.path.isfile(INFO_PATH):
            createDefaultInfo(INFO_PATH)

        self.baseConfig = loadYaml(INFO_PATH)

        # Sanity check contents of info and throw it out if bad
        if not sanityCheck(self.baseConfig):
            os.remove(INFO_PATH)
            createDefaultInfo(INFO_PATH)
            self.baseConfig = loadYaml(INFO_PATH)

    def close(self):
        ''' Write out leftovers, encrypt if needed, and empty it all out '''
        pass


def sanityCheck(contents):
    '''
    Error checking on the read YAML file. 

    :param contents: the read-in yaml to check
    :type contents: dict.
    :returns: True if valid, else false
    '''
    for k in INFO_REQUIRES:
        if k not in contents:
            return False

    # Check the validity of the contents

    return True


def createDefaultInfo(path):
    default = '''
    version: 1
    accounts: ""
    currentAccount: null
    '''

    writeYaml(default, path)


def writeYaml(contents, path):
    ''' Overwrites content with YAML representation at given path '''
    with open(path, 'w') as f:
        f.write(yaml.dump(contents, default_flow_style=False))


def loadYaml(path):
    ''' Return dict from YAML found at path '''
    with open(path, 'r') as f:
        return yaml.load(f)
