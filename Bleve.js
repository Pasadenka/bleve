(function() {
    if ( typeof Object.prototype.uniqueId === "undefined" ) {
        var id = 0;
        Object.prototype.Id = function() {
            if ( typeof this.__uniqueid === "undefined" ) {
                this.__uniqueid = ++id;

            }
            return this.__uniqueid;
        };
    }
})();

bleve = function () {

	var version = "bleve-alpha";

	this.getVersion = function () {

		return version;
	}

    var listeners = [];

    var dependence = [];

    var removeListener = function (listener, id) {

        for (var i = 0; i < listeners.length; i++) {

            if (listeners[i].listener == listener && listeners[i].id == id) return listeners.splice(i,1);
        }
    }

    var removeListeners = function (toRemove) {

        for (var i = 0; i < toRemove.length; i++) {

            removeListener(toRemove[i].listener, toRemove[i].id);
        }
    }

    var assign = function (listener, assigner, done, emitor, autoUnassign, dependency, did) {

        assigner = (assigner === 0)?{Id:function(){return 0;}}:assigner;
        emitor = (emitor === undefined)?0:emitor;
        autoUnassign = (typeof autoUnassign === "boolean")?autoUnassign:false;
        dependency = (dependency === undefined)?null:dependency;
        did = (did === undefined)?false:did;

        if(listener)

        listeners.push({listener:listener, id:assigner.Id(), assigner:assigner, done:done, emitor:emitor, autoUnassign:autoUnassign, dependency:dependency, did:did});
    }

    var dependencyManager = function (listener, emitor, data) {

        var dependencyAssigner;
        var complete = 0;

        for (var i = 0; i < dependence.length; i++) {

            if (dependence[i].dependency === listener.dependency) {

                dependencyAssigner = dependence[i];

                for (var j = 0; j < dependencyAssigner.children.length; j++) {

                    if (dependencyAssigner.children[j].did === listener.did) {

                        dependencyAssigner.child = dependencyAssigner.children[j];
                    }

                    if (dependencyAssigner.children[j].called === false) complete++;
                }
            }
        }

        if(typeof dependencyAssigner === undefined) return;

        if (typeof listener.done === "function") listener.done({emitor:emitor, data:data, assigner:listener.assigner, dateTime:new Date()});

        dependencyAssigner.child.called = true;
        complete--;

        if (listener.autoUnassign) removeListener(listener.listener, listener.id);

        if (!complete) {

            if (typeof dependencyAssigner.done === "function") dependencyAssigner.done({emitor:emitor, data:data, assigner:dependencyAssigner.assigner, dateTime:new Date()});

            if (dependencyAssigner.autoUnassign) {

                for (var i = 0; i < dependence.length; i++) {

                    if (dependence[i].assigner === dependencyAssigner.assigner && dependence[i].depyd === dependencyAssigner.depyd) return dependence.splice(i,1);
                }
            } else {

                for (var j = 0; j < dependencyAssigner.children.length; j++) {

                    dependencyAssigner.children[j].called = false;
                }
            }

            return;
        }
    }

    this.getListeners = function () {

        return o.clone(listeners);
    }

    this.getDependence = function () {

        return o.clone(dependence);
    }

    this.dependencyAssign = function (depyd, assigner, assignees, done, autoUnassign) {

        crypto = crypto || msCrypto;

        var dependency = crypto.getRandomValues(new Uint32Array(1))[0];
        var childrenList = [];
        autoUnassign = (typeof autoUnassign === "boolean")?autoUnassign:false;
        assigner = (assigner === 0)?{Id:function(){return 0;}}:assigner;

        for (var i = 0; i < assignees.length; i++) {

            assignees[i].autoUnassign = (typeof assignees[i].autoUnassign === "boolean")?assignees[i].autoUnassign:autoUnassign;
            childrenList.push({did:i,called:false});
            assign(assignees[i].listener, assigner, assignees[i].done, assignees[i].emitor, assignees[i].autoUnassign, dependency, i);
        }

        dependence.push({assigner:assigner, done:done, autoUnassign:autoUnassign, dependency:dependency, children:childrenList, depyd:depyd});
    }

    this.assign = function (listener, assigner, done, emitor, autoUnassign) {

        assign(listener, assigner, done, emitor, autoUnassign);
    }

    this.unassign = function (listener, id) {

        removeListener(listener, id);
    }

    this.dependencyUnassign = function (depyd, all, id) {

        for (var i = 0; i < dependence.length; i++) {

            if (dependence[i].assigner === id && dependence[i].depyd === depyd) {

                if (all) {

                    for (var j = 0; j < dependence[i].children.length; j++) {

                        for (var k = 0; k < listeners.length; k++) {

                            if (listeners[k].dependency === dependence[i].dependency && listeners[k].id === dependence[i].children.id) return listeners.splice(k,1);
                        }
                    }
                }

                return dependence[i].splice(i,1);
            }
        }
    }

    this.emit = function (listener, emitor, data) {

        var toRemove = [];

        for (var i = 0; i < listeners.length; i++) {

            if (listeners[i].listener === listener) {

                var doo = false;
                if (!!listeners[i].emitor && listeners[i].emitor === emitor.Id()) doo = true;
                if (!!!listeners[i].emitor) doo = true;

                if (doo) {

                    if(!!listeners[i].dependency) {

                        dependencyManager(listeners[i]);
                    } else {

                        if (typeof listeners[i].done === "function") listeners[i].done({emitor:emitor, data:data, assigner:listeners[i].assigner, dateTime:new Date()});
                        if (listeners[i].autoUnassign) toRemove.push({listener:listener, id:listeners[i].id});
                    }
                }
            }
        }

        removeListeners(toRemove);
    }

};

var Bleve = new bleve();

Object.prototype.bleve = new bleve();

Object.prototype.unassign = function (listener) {

    Bleve.unassign(listener, this.Id());
}

Object.prototype.dependencyUnassign = function (depyd, all) {

    Bleve.dependencyUnassign(depyd, all, this.Id());
}

Object.prototype.assign = function (listener, done, emitor, autoUnassign) {

    Bleve.assign(listener, this, done, emitor, autoUnassign);
}

Object.prototype.dependencyAssign = function (depyd, assignees, done, autoUnassign) {

    Bleve.dependencyAssign(depyd, this, assignees, done, autoUnassign);
}

Object.prototype.emit = function (listener, data) {

    Bleve.emit(listener, this, data);
}

unassign = function (listener) {

    Bleve.unassign(listener, 0);
}

assign = function (listener, done, emitor, autoUnassign) {

    Bleve.assign(listener, 0, done, emitor, autoUnassign);
}

dependencyAssign = function (assignees, done, autoUnassign) {

    Bleve.dependencyAssign(0, assignees, done, autoUnassign);
}

emit = function (listener, data) {

    Bleve.emit(listener, 0, data);
}
