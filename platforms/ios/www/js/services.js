angular.module('mystuff.services', [])

    .factory('Main', function ($q, $rootScope, DB, Util) {

        var mycajas = [];
        var mytags = [];
        var maxCosaId = 0;

        var initCajasDeferrer = $q.defer();
        var ready = $q.defer();

        function j(json) {
            console.log(' -> ' + JSON.stringify(json));
        }

        function init() {
            console.log("INIT");

            DB.allCajas().then(function (cajas) {
                initCajasDeferrer.resolve(cajas);

                j(mycajas);
                j(cajas);

                if (!_.find(mycajas, {_id: '1'}) && !_.find(cajas, {_id: '1'})) {
                    var eliminadas = {
                        _id: '1',
                        name: 'Eliminadas Recientes',
                        special: 'del'
                    };
                    DB.upsertCaja(eliminadas);
                }
            });

            initCajasDeferrer.promise.then(function (cajas) {
                var favoritas = {
                    _id: '0',
                    name: 'Favoritas',
                    special: 'fav',
                    cosas: []
                };

                //agregamos la caja mula de las favoritas
                Util.safePush(cajas, favoritas);

                _.each(cajas, function (caja) {
                    caja.cosas = [];
                    Util.safePush(mycajas, caja);
                });

                DB.allCosas().then(
                    function (cosas) {
                        _.each(mycajas, function (caja) {
                            _.each(cosas, function (cosa) {
                                if (cosa.caja._id == caja._id) {
                                    caja.cosas.push(cosa);
                                }
                                if (caja._id == '0' && cosa.fav) {
                                    Util.safePush(caja.cosas, cosa);
                                }
                            });
                        });

                        mytags = getTags();
                        maxCosaId = Util.getMaxCosaId(mycajas);
                        ready.resolve();
                    });
            });
        }

        function getTags() {
            var arr = [];
            _.each(mycajas, function (caja) {
                if (!caja.special) {
                    _.each(caja.cosas, function (cosa) {
                        _.each(cosa.tags, function (tag) {
                            var bla = _.find(arr, {name: tag.name});
                            if (bla) {
                                bla.count++;
                            } else {
                                arr.push({name: tag.name, count: 1});
                            }
                        });
                    });
                }
            });

            return arr;
        }

        function refreshTags(){
            var newTags = getTags();
            var bigger = newTags.length >= mytags.length ? newTags : mytags;
            var smaller = newTags.length < mytags.length ? newTags : mytags;

            for (var i = 0; i < bigger.length; ++i) {
                var tagBigger = bigger[i];
                var tagSmaller = _.find(smaller, {name: tagBigger.name});
                if (tagSmaller) {
                    tagSmaller.count = tagBigger.count;
                } else {
                    smaller.push(tagBigger);
                }
            }
        }

        init();

        var scope = $rootScope.$new();

        scope.$on('upsertCaja', function (event, cajaDoc) {
            ready.promise.then(function () {
                console.log("EVENT UPSERT CAJA = " + Util.j(cajaDoc));

                var cajaFound = _.find(mycajas, {_id: cajaDoc._id});
                if (cajaFound) { //update
                    _.extend(cajaFound, cajaDoc);
                } else { //add
                    cajaDoc.cosas = [];
                    mycajas.push(cajaDoc);
                }
            });
        });

        scope.$on('deleteCaja', function (event, id) {
            ready.promise.then(function () {
                console.log("DELETE CAJA = " + id);
                Util.removeFrom(mycajas, '_id', id);
            });
        });

        scope.$on('upsertCosa', function (event, cosaDoc) {
            ready.promise.then(function () {
                console.log("EVENT UPSERT COSA = " + Util.j(cosaDoc));

                //busco si esta en una caja
                var found = false;
                _.each(mycajas, function (caja) {
                    var find = _.find(caja.cosas, {_id: cosaDoc._id});
                    if (find) {
                        console.log("encontrada en " + caja._id);
                        if (caja._id == '0') {//fav
                            if (!cosaDoc.fav) {
                                Util.removeFrom(caja.cosas, {_id: cosaDoc._id});
                            } else {
                                _.extend(find, cosaDoc);
                            }
                        } else {
                            found = true;
                            if (caja._id == cosaDoc.caja._id) {
                                console.log("no cambio caja");
                                _.extend(find, cosaDoc);
                            } else {
                                console.log("la saco de " + caja._id);
                                Util.removeFrom(caja.cosas, {_id: cosaDoc._id});
                                console.log("la agrego a " + cosaDoc.caja._id);
                                _.find(mycajas, {_id: cosaDoc.caja._id}).cosas.push(cosaDoc);
                            }
                        }
                    }
                });

                if (!found) {
                    _.find(mycajas, {_id: cosaDoc.caja._id}).cosas.push(cosaDoc);
                }

                if (cosaDoc.fav) {
                    var cajaFav = _.find(mycajas, {_id: '0'});
                    if (!_.find(cajaFav.cosas, {_id: cosaDoc._id})) {
                        cajaFav.cosas.push(cosaDoc);
                    }
                }

                refreshTags();
            });
        });

        scope.$on('deleteCosa', function (event, id) {
            ready.promise.then(function () {
                console.log("DELETE COSA = " + id);
                _.each(mycajas, function (caja) {
                    if (_.find(caja.cosas, {_id: id})) {
                        Util.removeFrom(caja.cosas, {_id: id});
                    }
                });
                refreshTags();
            });
        });

        return {
            allCajas: function () {
                return mycajas;
            },
            allCosas: function () {
                var many = Util.getMany(mycajas, function (cosa) {
                    return true;
                });
                console.log("----------------- many = " + JSON.stringify(many));
                return many;
            },
            allTags: function () {
                return mytags;
            },
            getCaja: function (cajaId) {
                return _.find(mycajas, {_id: cajaId});
            },
            getCosa: function (cosaId) {
                return Util.getOne(mycajas, function(cosa){
                   return cosa._id == cosaId;
                });
            },
            getCosas: function (busqueda, exact) {
                var thiz = this;
                return Util.getMany(mycajas, function(cosa){
                    return thiz.matches(cosa, busqueda, exact);
                });
            },
            getFavourite: function () {
                return this.getCaja('0');
            },
            getDeleted: function () {
                return this.getCaja('1');
            },
            matches: function (cosa, busqueda, exact) {
                for (var i = 0; i < cosa.tags.length; ++i) {
                    if (exact) {
                        if (cosa.tags[i].name == busqueda) {
                            return true;
                        }
                    } else {
                        //Es un simil de stratsWith
                        if (cosa.tags[i].name.toLowerCase().indexOf(busqueda.toLowerCase()) == 0) {
                            return true;
                        }
                    }
                }
                return false;
            },
            addCaja: function (name) {
                var max = Util.getMaxCajaId(mycajas);
                var newCaja = {
                    _id: mycajas.length == 0 ? '0' : (max + 1) + '',
                    name: name
                };
                DB.upsertCaja(newCaja);
            },
            addCosa: function (caja, filePath) {
                var nuevaCosa = {
                    _id: (++maxCosaId) + '',
                    foto: filePath,
                    tags: [],
                    caja: {_id: caja._id, name: caja.name}
                };
                DB.upsertCosa(nuevaCosa);
            },
            addTag: function (name) {
                mytags.push({
                    name: name,
                    count: 0
                });
            },
            removeCosa: function (cosa) {
                //Si ya está en la caja de eliminados, lo borro para siempre
                if (cosa.caja._id == this.getDeleted()._id) {
                    DB.deleteCosa(cosa);
                } else {
                    //ahora lo borro de la caja donde estaba y lo pongo en la de las borradas
                    cosa.caja._id = this.getDeleted()._id;
                    cosa.caja.name = this.getDeleted().name;
                    DB.upsertCosa(cosa);
                }
            },
            removeCaja: function (caja) {
                DB.deleteCaja(caja);
            },
            toggleFavourite: function (cosa) {
                cosa.fav = !cosa.fav;
                DB.upsertCosa(cosa);
            },
            removeTag: function (tagName) {
                Util.removeFrom(mytags, 'name', tagName);
            },
            toggleTag: function (cosa, tagName) {
                var found = _.find(cosa.tags, {name: tagName});
                if (found) {
                    Util.removeFrom(cosa.tags, 'name', tagName);
                    _.find(mytags, {name: tagName}).count--;
                } else {
                    cosa.tags.push({name: tagName});
                    _.find(mytags, {name: tagName}).count++;
                }
                DB.upsertCosa(cosa);
            },
            moveTo: function (cosa, cajaTo) {
                cosa.caja._id = cajaTo._id;
                cosa.caja.name = cajaTo.name;
                DB.upsertCosa(cosa);
            }
        };
    })

    .factory('DB', function ($q, $rootScope, Util) {
        var dbCajas = new PouchDB("cbarrera-cajas");
        var dbCosas = new PouchDB("cbarrera-cosas");
        //dbCajas.destroy();
        //dbCosas.destroy();
        //dbCajas = new PouchDB("cbarrera-cajas");
        //dbCosas = new PouchDB("cbarrera-cosas");

        dbCajas.changes({
            continuous: true,
            onChange: function (change) {
                if (!change.deleted) {
                    $rootScope.$apply(function () {
                        dbCajas.get(change.id, function (err, doc) {
                            $rootScope.$apply(function () {
                                if (err) console.log(err);
                                $rootScope.$broadcast('upsertCaja', doc);
                            })
                        });
                    })
                } else {
                    $rootScope.$apply(function () {
                        $rootScope.$broadcast('deleteCaja', change.id);
                    });
                }
            }
        });
        dbCosas.changes({
            continuous: true,
            onChange: function (change) {
                if (!change.deleted) {
                    $rootScope.$apply(function () {
                        dbCosas.get(change.id, function (err, doc) {
                            $rootScope.$apply(function () {
                                if (err) console.log(err);
                                $rootScope.$broadcast('upsertCosa', doc);
                            })
                        });
                    })
                } else {
                    $rootScope.$apply(function () {
                        $rootScope.$broadcast('deleteCosa', change.id);
                    });
                }
            }
        });

        return {
            allCajas: function () {
                var deferrer = $q.defer();
                console.log("DB - ALL CAJAS");

                dbCajas.allDocs({include_docs: true}).then(
                    function (res) {
                        //console.log("res = " + JSON.stringify(res));
                        var docs = res.rows.map(function (row) {
                            return row.doc;
                        });
                        deferrer.resolve(docs);
                    },
                    function (err) {
                        console.log("XXXXXXXXXXXXXXXXXX ALL CAJAS err = " + Util.j(err));
                        deferrer.reject();
                    });

                return deferrer.promise;
            },
            upsertCaja: function (caja) {
                var deferrer = $q.defer();
                console.log("DB ----------- UPSERT CAJA " + Util.j(caja));

                dbCajas.put(caja).then(function (data) {
                    caja._rev = data.rev;
                    deferrer.resolve(caja);
                }, function (err) {
                    console.log("XXXXXXXXXXXXXXXXXX UPSERT CAJA err = " + Util.j(err));
                    deferrer.reject();
                });

                return deferrer.promise;
            },
            deleteCaja: function (caja) {
                var deferrer = $q.defer();
                console.log("DB ----------- DELETE CAJA " + caja.name);

                dbCajas.remove(caja).then(function () {
                    deferrer.resolve();
                }, function (err) {
                    console.log("XXXXXXXXXXXXXXXXXX DELETE CAJA err = " + Util.j(err));
                    deferrer.reject(err);
                });

                return deferrer.promise;
            },

            allCosas: function () {
                var deferrer = $q.defer();
                console.log("DB - ALL COSAS");

                dbCosas.allDocs({include_docs: true}).then(
                    function (res) {
                        //console.log("res = " + JSON.stringify(res));
                        var docs = res.rows.map(function (row) {
                            return row.doc;
                        });
                        deferrer.resolve(docs);
                    },
                    function (err) {
                        console.log("XXXXXXXXXXXXXXXXXX ALL COSAS err = " + Util.j(err));
                        deferrer.reject(err);
                    });

                return deferrer.promise;
            },
            upsertCosa: function (cosa) {
                var deferrer = $q.defer();
                console.log("DB ----------- UPSERT COSA " + Util.j(cosa));

                dbCosas.put(cosa).then(function (data) {
                    //console.log("upsert cosa resolve " + Util.j(data));
                    cosa._rev = data.rev;
                    deferrer.resolve();
                }, function (err) {
                    console.log("XXXXXXXXXXXXXXXXXX UPSERT COSA err = " + Util.j(err));
                    deferrer.reject(err);
                });

                return deferrer.promise;
            },
            deleteCosa: function (cosa) {
                var deferrer = $q.defer();
                console.log("DB ----------- DELETE COSA " + cosa._id);

                dbCosas.remove(cosa).then(function () {
                    deferrer.resolve();
                }, function (err) {
                    console.log("XXXXXXXXXXXXXXXXXX DELETE COSA err = " + Util.j(err));
                    deferrer.reject(err);
                });

                return deferrer.promise;
            },

            deleteDB: function () {
                dbCajas.destroy();
                dbCosas.destroy();
                dbCajas = new PouchDB("cbarrera-cajas");
                dbCosas = new PouchDB("cbarrera-cosas");
            }
        };
    })

    .factory('Util', function () {
        return {
            replaceAll: function (find, replace, str) {
                return str.replace(new RegExp(find, 'g'), replace);
            },
            removeFrom: function (items, key, value) {
                for (var i = 0; i < items.length; ++i) {
                    if (items[i][key] == value) {
                        items.splice(i, 1);
                    }
                }
            },
            safePush: function (items, item) {
                if (!_.find(items, {_id: item._id})) {
                    items.push(item);
                }
            },
            getMaxCajaId: function (cajas) {
                var max = 0;
                for (var i = 0; i < cajas.length; ++i) {
                    if (parseInt(cajas[i]._id) > max) {
                        max = parseInt(cajas[i]._id);
                    }
                }
                return max;
            },
            getMaxCosaId: function (cajas) {
                var max = 0;
                for (var i = 0; i < cajas.length; ++i) {
                    for (var j = 0; j < cajas[i].cosas.length; ++j) {
                        if (parseInt(cajas[i].cosas[j]._id) > max) {
                            max = parseInt(cajas[i].cosas[j]._id);
                        }
                    }
                }
                return max;
            },
            j: function (json) {
                return JSON.stringify(json);
            },
            getOne: function(cajas, matchfunction, includeSpecial){
                for(var i=0; i<cajas.length; ++i){
                    if(!includeSpecial && cajas[i].special) continue;
                    for(var j=0; j<cajas[i].cosas.length; ++j){
                        if(matchfunction(cajas[i].cosas[j])){
                            return cajas[i].cosas[j];
                        }
                    }
                }
                return undefined;
            },
            getMany: function(cajas, matchfunction){
                var ret = [];
                for(var i=0; i<cajas.length; ++i){
                    if(cajas[i].special) continue;
                    for(var j=0; j<cajas[i].cosas.length; ++j){
                        if(matchfunction(cajas[i].cosas[j])){
                            this.safePush(ret, cajas[i].cosas[j]);
                        }
                    }
                }
                return ret;
            }
        };
    })

;