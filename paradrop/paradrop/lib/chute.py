###################################################################
# Copyright 2013-2015 All Rights Reserved
# Authors: The Paradrop Team
###################################################################

from paradrop.lib.utils.output import out, logPrefix

STATE_INVALID = "invalid"
STATE_DISABLED = "disabled"
STATE_RUNNING = "running"
STATE_FROZEN = "frozen"
STATE_STOPPED = "stopped"

class Chute(object):
    """
        Wrapper class for Chute objects.
    """
    def __init__(self, descriptor):
        # Set these first so we don't have to worry about it later
        self.name = None
        self.state = None
        
        self._cache = {}
        self.__dict__.update(obj)
        
    def __repr__(self):
        return "<Chute %s - %s>" % (self.name, self.state)
    
    def __str__(self):
        s = "Chute:%s\n" % (self.name)
        return s

    def fullDump(self):
        """Return a dump of EVERYTHING in this chute including all API data and all internal cache data."""
        d = self.__dict__
        d['cache'] = d.pop('_cache')
        return d

    def isValid(self):
        """Return True only if the Chute object we have has all the proper things defined to be in a valid state."""
        if(not self.name or len(self.name) == 0):
            return False
        return True

    def delCache(self, key):
        """Delete the key:val from the _cache dict object."""
        if(key in self._cache.keys()):
            del(self._cache[key])
    
    def setCache(self, key, val):
        """Set the key:val into the _cache dict object to carry around."""
        self._cache[key] = val

    def getCache(self, key):
        """Get the val out of the _cache dict object, or None if it doesn't exist."""
        return self._cache.get(key, None)

    def dumpCache(self):
        """
            Return a string of the contents of this chute's cache.
            In case of catastrophic failure dump all cache content so we can debug.
        """
        return "\n".join(["%s:%s" % (k,v) for k,v in self._cache.iteritems()])
    
    def appendCache(self, key, val):
        """
            Finds the key they requested and appends the val into it, this function assumes the cache object
            is of list type, if the key hasn't been defined yet then it will set it to an empty list.
        """
        r = self.getCache(key)
        if(not r):
            r = []
        elif(not isinstance(r, list)):
            out.warn('** %s Unable to append to cache, not list type\n' % logPrefix())
            return
        r.append(val)
        self.setCache(key, r)
