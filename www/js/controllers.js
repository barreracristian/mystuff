angular.module('mystuff.controllers', ['ionic', 'ngCordova'])

// Rafaga para writefile

    .controller('CajasCtrl', function ($scope, $ionicPopup, Main, Util, DB) {
        $scope.cajas = Main.allCajas();

        $scope.add = function () {
            $ionicPopup.prompt({
                title: 'Nueva Caja',
                template: 'Nombre de su nueva caja',
                inputType: 'text',
                inputPlaceholder: ''
            }).then(
                function (name) {
                    if (name && name.trim().length > 0) {
                        Main.addCaja(name.trim());
                    }
                },
                function (err) {
                    console.log("add caja err = " + JSON.stringify(err));
                }
            );
        };

        $scope.cajasCustomOrder = function (caja) {
            if (caja.special == 'fav') {
                return '.............';
            } else if (caja.special == 'del') {
                return 'zzzzzzzzzzzzzz';
            } else {
                return caja.name;
            }
        };

        $scope.deleteDB = function () {
            DB.deleteDB();
        }

    })

    .controller('CajaCtrl', function ($q, $state, $scope, $timeout, $stateParams, $cordovaFile, $cordovaImagePicker, Main, Util) {
        $scope.Util = Util;
        $scope.caja = Main.getCaja($stateParams.cajaId);
        //checkFiles();

        var options = {
            maximumImagesCount: 33,
            width: 500,
            height: 500,
            quality: 80
        };

        //$scope.debug = cordova.file.dataDirectory;

        //debug
        $scope.addCosa = function () {
            Main.addCosa($scope.caja, "./img/IPH_001.JPG");
        };

        //debug
        var checkFiles = function () {
            for (var i = 0; i < $scope.caja.cosas.length; ++i) {
                var cosa = $scope.caja.cosas[i];
                $cordovaFile.checkFile(cordova.file.dataDirectory, cosa.foto)
                    .then(function (success) {
                        console.log("check sucess = " + JSON.stringify(success));
                    }, function (error) {
                        console.log("check error = " + JSON.stringify(error));
                        // error
                    });
            }
        };

        $scope.removeCaja = function (caja) {
            Main.removeCaja(caja);
            $state.go('tab.cajas');
        };

        $scope.import = function () {
            var promises = [];
            $cordovaImagePicker.getPictures(options).then(
                function (results) {
                    for (var i = 0; i < results.length; i++) {
                        console.log('getPictures - Image URI: ' + JSON.stringify(results[i]));
                        window.resolveLocalFileSystemURL(results[i], function (fileEntry) {
                            console.log("fileEntry.name = " + fileEntry.name);
                            var p = moveFile(fileEntry.nativeURL.replace(fileEntry.name, ''), fileEntry.name);
                            promises.push(p);
                            p.then(function (fileName) {
                                Main.addCosa($scope.caja, fileName);
                            });
                        }, function (error) {
                            console.log('getPictures err = ' + JSON.stringify(error));
                        });
                    }

                    $q.all(promises).then(
                        function (sucess) {
                            console.log("All moves OK");
                        },
                        function (err) {
                            console.log("No all moves ok, err = " + JSON.stringify(err));
                        });
                },
                function (err) {
                    console.log("getPictures err = " + JSON.stringify(err));
                }
            );
        };

        function moveFile(fromPath, fromFilename) {
            //console.log("moveFile = " + fromPath + " filename = " + fromFilename);
            var moveFileP = $q.defer();
            var destDir = cordova.file.dataDirectory;
            var destFileName = Math.random().toString(36).substr(2, 9) + fromFilename.substring(fromFilename.lastIndexOf('.'));

            //moveFile(path, file, newPath, newFile)
            $cordovaFile.moveFile(fromPath, fromFilename, destDir, destFileName)
                .then(function (newFile) {
                    console.log("moveFile OK " + JSON.stringify(newFile));
                    moveFileP.resolve(newFile.name);
                    //moveFileP.resolve(newFile.nativeURL);
                }, function (err) {
                    console.log("moveFile FAILED " + fromFilename + " error: " + JSON.stringify(err));
                    moveFileP.reject(err);
                });

            return moveFileP.promise;
        }

    })

//

    .controller('BusquedaCtrl', function ($scope, Main, Util) {
        $scope.Util = Util;
        $scope.cosas = Main.allCosas();

        $scope.data = {};
        $scope.data.busqueda = '*';

        $scope.filtraCosas = function (cosa) {
            if ($scope.data.busqueda) {
                return Main.matches(cosa, $scope.data.busqueda);
            } else {
                return false;
            }
        };
    })

//

    .controller('TagsCtrl', function ($scope, $state, $ionicPopup, Main, Util) {
        $scope.tags = Main.allTags();

        $scope.add = function () {
            $ionicPopup.prompt({
                title: 'Nuevo Tag',
                template: 'Nombre del nuevo tag',
                inputType: 'text',
                inputPlaceholder: ''
            }).then(
                function (name) {
                    if (name && name.trim().length > 0) {
                        name = Util.replaceAll(' ', '', name).toLowerCase();
                        Main.addTag(name.trim());
                    }
                },
                function (err) {
                    console.log("new tag error");
                }
            );
        };

        $scope.bulkTags = function (tag) {
            $state.go('tab.tag-bulk', {tag: tag.name});
        }
    })

    .controller('TagBulkCtrl', function ($scope, $stateParams, $ionicPopup, Main, Util) {
        $scope.Util = Util;
        $scope.tagName = $stateParams.tag;
        $scope.cosas = Main.allCosas();
        console.log("TagBulkCtrl " + JSON.stringify($scope.cosas));

        $scope.toggle = function (cosa) {
            console.log("togle cosa " + JSON.stringify(cosa));
            Main.toggleTag(cosa, $scope.tagName);
        };

        $scope.contiene = function (tags, name) {
            return _.find(tags, {name: name});
        };
    })

    .controller('TagListCtrl', function ($scope, $state, $stateParams, Main, Util) {
        $scope.Util = Util;
        $scope.tagName = $stateParams.tag;
        $scope.cosas = Main.getCosas($scope.tagName, true);

        $scope.removeTag = function (tagName) {
            Main.removeTag(tagName);
            $state.go('tab.tags');
        }
    })

//

    .controller('CosaCtrl', function ($timeout, $scope, $stateParams, $location, $ionicPopup, $ionicActionSheet, Main, Util) {
        $scope.Util = Util;

        //url: '/cajas/     :cajaId/    :cosaId'
        //url: '/busqueda/  :busqueda/  :cosaId'
        //url: '/tags/      :tag/       :cosaId'

        var loc = $location.path().substring(1);
        loc = loc.substring(loc.indexOf('/') + 1);
        loc = loc.substring(0, loc.indexOf('/'));
        $scope.contexto = loc; //cajas | busqueda | tags;

        $scope.container = {};
        if ($stateParams.cajaId) {
            var caja = Main.getCaja($stateParams.cajaId);
            $scope.container.name = caja.name;
            $scope.container.cosas = caja.cosas;
        } else if ($stateParams.busqueda) {
            $scope.container.name = $stateParams.busqueda;
            $scope.container.cosas = Main.getCosas($stateParams.busqueda);
        } else if ($stateParams.tag) {
            $scope.container.name = '#' + $stateParams.tag;
            $scope.container.cosas = Main.getCosas($stateParams.tag, true);
        } else {
            //error
        }

        $scope.voyen = 0;

        for (var i = 0; i < $scope.container.cosas.length; ++i) {
            if ($scope.container.cosas[i]._id == $stateParams.cosaId) {
                $scope.voyen = i;
                break;
            }
        }
        $scope.cosa = $scope.container.cosas[$scope.voyen];

        //---

        $scope.cardSwipedLeft = function () {
            if ($scope.container.cosas.length == 0) {
                $scope.voyen = -1;
                $scope.cosa = undefined;
            } else {
                $scope.voyen = ++$scope.voyen % $scope.container.cosas.length;
                $scope.cosa = $scope.container.cosas[$scope.voyen];
            }
        };

        $scope.cardSwipedRight = function () {
            if ($scope.container.cosas.length == 0) {
                $scope.voyen = -1;
                $scope.cosa = undefined;
            } else {
                $scope.voyen = --$scope.voyen % $scope.container.cosas.length;
                if ($scope.voyen < 0) {
                    $scope.voyen = $scope.container.cosas.length + $scope.voyen;
                }
                $scope.cosa = $scope.container.cosas[$scope.voyen];
            }
        };

        $scope.erase = function (cosa) {
            $ionicPopup.confirm({
                title: 'Eliminar cosa',
                template: 'Estás segur@ que deseas eliminar esta cosa ?',
                cancelText: 'Cancelar',
                okText: 'Si, borrar !'
            }).then(function (res) {
                if (res) {
                    //Y ahora lo borro de t0d0
                    Main.removeCosa(cosa);

                    //Lo tengo que borrar del container, porque tiene una copia de las cosas
                    Util.removeFrom($scope.container.cosas, '_id', cosa._id);
                    $scope.cardSwipedLeft();
                }
            });
        };

        $scope.favourite = function () {
            Main.toggleFavourite($scope.cosa);
        };

        $scope.move = function (cosa) {
            var cajas = Main.allCajas();
            var names = [];
            _.each(cajas, function (caja) {
                if (caja.name != cosa.caja.name && !caja.special) {
                    if (!_.find(names, {text: caja.name})) {
                        names.push({text: caja.name, caja: caja});
                    }
                }
            });

            var hideSheet = $ionicActionSheet.show({
                titleText: 'Elije la caja destino',
                cancelText: 'Cancelar',
                buttons: names,
                cancel: function () {
                },
                buttonClicked: function (index) {
                    Main.moveTo(cosa, names[index].caja);
                    hideSheet();

                    //Lo tengo que borrar del container, porque tiene una copia de las cosas
                    Util.removeFrom($scope.container.cosas, '_id', cosa._id);
                    $scope.cardSwipedLeft();

                    return true;
                }
            });
        };

    })

    .controller('CosaTagsCtrl', function ($scope, $stateParams, $ionicPopup, Main) {
        $scope.tags = Main.allTags();
        $scope.cosa = Main.getCosa($stateParams.cosaId);

        $scope.data = {};
        $scope.data.checks = [];
        _.each($scope.tags, function (tagplus) {
            var bla = _.find($scope.cosa.tags, {name: tagplus.name}) != undefined;
            $scope.data.checks.push({name: tagplus.name, count: tagplus.count, checked: bla});
        });

        $scope.checkboxChange = function (tagplus) {
            //tagplus {"name":"animalprint","count":1,"checked":true,
            Main.toggleTag($scope.cosa, tagplus.name);
        }

    })

;
