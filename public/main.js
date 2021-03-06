'use strict';

var ustcTennis = angular.module('ustc.tennis', ['ui.router', 'ui.bootstrap']);

ustcTennis.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('feed/1');
    $stateProvider
        .state('config', {
            url: '/config',
            controller: 'ConfigCtrl',
            templateUrl: 'view/config.html'
        })
        .state('scoring', {
            url: '/scoring',
            controller: 'ScoringCtrl',
            templateUrl: 'view/scoring.html'
        })
        .state('result', {
            url: '/result',
            controller: 'ResultCtrl',
            templateUrl: 'view/result.html'
        })
        .state('feed', {
            url: '/feed/:pageNum',
            controller: 'FeedCtrl',
            templateUrl: 'view/feed.html'
        })
        .state('match', {
            url: '/match/:id',
            controller: 'MatchCtrl',
            templateUrl: 'view/match.html'
        })
        .state('player', {
            url: '/player/:name',
            controller: 'PlayerCtrl',
            templateUrl: 'view/player.html'
        })
        .state('rank', {
            url: '/rank',
            controller: 'RankCtrl',
            templateUrl: 'view/rank.html'
        })
});

// pass match data to scoring page
ustcTennis.service('matchService', function() {
    var match = {};

    var addMatch = function(customMatch) {
        match = customMatch;
    };

    var getMatch = function() {
        // generate default match info
        if (Object.keys(match).length === 0) {
            match = {
                player1: 'P-1',
                player2: 'P-2',
                title: 'Test Match',
                sets: 6,
                server: 'P1',
                advantage: true,
                started: new Date('2016-05-20T15:00:00'),
                ended: new Date('2011-05-20T15:45:00')
            }
        }
        return match;
    };

    return {
        addMatch: addMatch,
        getMatch: getMatch
    }
});

// pass progress data to result page
ustcTennis.service('progressService', function() {
    var progress = [];

    var addProgress = function(customProgress) {
        progress = customProgress;
    };

    var getProgress = function() {
        // default match progress data
        if (Object.keys(progress).length === 0) {
            progress = window.DEMO_PROGRESS;
        }
        return progress;
    };

    return {
        addProgress: addProgress,
        getProgress: getProgress
    }
});

ustcTennis.controller('ConfigCtrl', function($scope, matchService) {
    // provide config data to service,
    $scope.submitMatch = function () {
        matchService.addMatch($scope.match);
    };
});

ustcTennis.controller('ScoringCtrl', function($scope, matchService, progressService, $location) {
    $scope.match = matchService.getMatch();
    $scope.match.started = new Date();

    // record all points in this match
    $scope.progress = [];

    // record current point selected on main panel
    $scope.currentPoint = {
        serveTime: '1st',
        hand: '',
        doubleFault: '',
        net: ''
    };

    // init current match status
    $scope.status = {
        currentServer: $scope.match.server,
        setsP1: 0,
        setsP2: 0,
        pointsP1: 0,
        pointsP2: 0
    };

    // define what happens when user clicks the 'Out' button
    $scope.setPointServeTime = function() {
        // when 1st serve is out
        if ($scope.currentPoint.serveTime == '1st') {
            $scope.currentPoint.serveTime = '2nd';
        }
        // when 2nd serve is out
        // set current point to double fault
        else if ($scope.currentPoint.serveTime == '2nd' && $scope.outBtn == 'OUT') {
            // when server makes double fault, the opponent wins
            $scope.currentPoint.win = ($scope.status.currentServer === 'P1') ? 'P2' : 'P1';
            $scope.currentPoint.type = 'UE';
            $scope.currentPoint.hand = 'F';
            $scope.currentPoint.net = '';
            $scope.currentPoint.doubleFault = 'DF';
            $scope.outBtn = 'Double F';
        } else {
            // reset all buttons
            clearBtnStatus();
        }

    };

    var endMatch = function(winner) {
        progressService.addProgress($scope.progress);
        $location.path('result');
        $scope.match.ended = new Date();
        alert("End of Match, Winner is " + winner + "!");
    };

    var clearBtnStatus = function() {
        $scope.currentPoint.serveTime = "1st";
        $scope.outBtn = 'OUT';
        $scope.currentPoint.doubleFault = "";
        $scope.currentPoint.win = "";
        $scope.currentPoint.type = "";
        $scope.currentPoint.hand = "";
        $scope.currentPoint.net = "";
    };

    var updatePointRegular = function() {
        var pointsP1 = $scope.status.pointsP1.toString();
        var pointsP2 = $scope.status.pointsP2.toString();
        var currentWinner = $scope.currentPoint.win;

        // update point according to table
        var nextPointTable = $scope.match.advantage ? window.NEXT_POINT_WITH_ADV : window.NEXT_POINT_WITHOUT_ADV;
        var nextPoint = nextPointTable[pointsP1][pointsP2][currentWinner];
        $scope.status.pointsP1 = nextPoint[0];
        $scope.status.pointsP2 = nextPoint[1];

        // when a set ends, update score of this set
        if (nextPoint[2] == true) {
            if (currentWinner === 'P1') {
                $scope.status.setsP1 = parseInt($scope.status.setsP1) + 1;
            } else {
                $scope.status.setsP2 = parseInt($scope.status.setsP2) + 1;
            }
            // swap server
            if ($scope.status.currentServer === 'P2') {
                $scope.status.currentServer = 'P1';
            } else {
                $scope.status.currentServer = 'P2';
            }
        }

        // end of match
        var maxSet = $scope.match.sets;
        if ($scope.status.setsP1 >= maxSet && $scope.status.setsP1 >= $scope.status.setsP2 + 2) {
            endMatch("P1");
        } else if ($scope.status.setsP2 >= maxSet && $scope.status.setsP2 >= $scope.status.setsP1 + 2) {
            endMatch("P2");
        }
    };

    var updatePointTieBreak = function() {
        var pointsP1 = parseInt($scope.status.pointsP1);
        var pointsP2 = parseInt($scope.status.pointsP2);
        var currentWinner = $scope.currentPoint.win;

        if (currentWinner === 'P1') {
            $scope.status.pointsP1 = pointsP1 + 1;
            $scope.status.pointsP2 = pointsP2;
        } else {
            $scope.status.pointsP1 = pointsP1;
            $scope.status.pointsP2 = pointsP2 + 1;
        }

        // end of tie break
        if ($scope.status.pointsP1 >= 7 && $scope.status.pointsP1 - $scope.status.pointsP2 >= 2) {
            $scope.status.setsP1 = parseInt($scope.match.sets) + 1;
            endMatch("P1");
        } else if ($scope.status.pointsP2 >= 7 && $scope.status.pointsP2 - $scope.status.pointsP1 >= 2) {
            $scope.status.setsP2 = parseInt($scope.match.sets) + 1;
            endMatch("P2");
        }
    };

    var savePoint = function() {
        // save this point
        var pointToSave = {
            pointsP1: $scope.status.pointsP1,
            pointsP2: $scope.status.pointsP2,
            setsP1: $scope.status.setsP1,
            setsP2: $scope.status.setsP2,
            pointServer: $scope.status.currentServer,
            pointWin: $scope.currentPoint.win,
            pointType: $scope.currentPoint.type,
            pointDoubleFault: $scope.currentPoint.doubleFault === null ? '' : $scope.currentPoint.doubleFault,
            pointHand: $scope.currentPoint.hand === null ? '' : $scope.currentPoint.hand,
            pointNet: $scope.currentPoint.net === null ? '' : $scope.currentPoint.net,
            pointServeTime: $scope.currentPoint.serveTime
        };
        $scope.progress.push(pointToSave);
        clearBtnStatus();
    };

    // update current point
    $scope.updatePoint = function() {
        $scope.status.setsP1 = parseInt($scope.status.setsP1);
        $scope.status.setsP2 = parseInt($scope.status.setsP2);

        if ($scope.status.setsP1 == $scope.match.sets && $scope.status.setsP2 == $scope.match.sets) {
            updatePointTieBreak();
        } else {
            updatePointRegular();
        }

        savePoint();
    };

});

ustcTennis.controller('ResultCtrl', function($scope, matchService, progressService, $http) {
    $scope.match = matchService.getMatch();
    $scope.progress = progressService.getProgress();

    $scope.upload = function() {
        var data = {
            'progress': $scope.progress,
            'stat': $scope.match,
            'p1': $scope.p1,
            'p2': $scope.p2
        };
        $http.post("upload", data);
        // console.log(data);
    };

    var progressLen = $scope.progress.length;
    $scope.match.endSetsP1 = $scope.progress[progressLen - 1].setsP1;
    $scope.match.endSetsP2 = $scope.progress[progressLen - 1].setsP2;

    function PlayerStat() {
        this.firstServeIn =  0;
        this.firstServeAll = 0;
        this.firstServeWon = 0;
        this.secondServeWon = 0;
        this.secondServeAll = 0;
        this.ace = 0;
        this.doubleFault = 0;
        this.winner = {'F': 0, 'B': 0};
        this.unforcedErr = {'F': 0, 'B': 0};
        this.netPoint = {'won': 0, 'all': 0};
        this.breakPoint = {'won': 0, 'all': 0};
        this.total = 0;
    }
    var p1 = new PlayerStat();
    var p2 = new PlayerStat();

    // stats for P1
    for (var i = 0; i < progressLen; i++) {
        var point = $scope.progress[i];
        if (point['pointServer'] === 'P1' && point['pointServeTime'] === '1st') {
            p1.firstServeIn++;
        }
        if (point['pointServer'] === 'P1') {
            p1.firstServeAll++;
        }
        if (point['pointServer'] === 'P1' && point['pointWin'] === 'P1') {
            p1.firstServeWon++;
        }
        if (point['pointServer'] === 'P1' && point['pointServeTime'] === '2nd' && point['pointWin'] === 'P1') {
            p1.secondServeWon++;
        }
        if (point['pointServer'] === 'P1' && point['pointServeTime'] === '2nd') {
            p1.secondServeAll++;
        }
        if (point['pointServer'] === 'P1' && point['pointType'] === 'ACE') {
            p1.ace++;
        }
        if (point['pointServer'] === 'P1' && point['pointDoubleFault'] === 'DF') {
            p1.doubleFault++;
        }
        if (point['pointWin'] === 'P1' && point['pointType'] === 'W') {
            p1.winner[point['pointHand']]++;
        }
        if (point['pointWin'] === 'P2' && point['pointType'] === 'UE') {
            p1.unforcedErr[point['pointHand']]++;
        }
        if (point['pointNet'] === 'P1') {
            p1.netPoint['all']++;
            if (point['pointWin'] === 'P1') {
                p1.netPoint['won']++;
            }
        }
        // break point judgement
        if (point['pointServer'] === 'P2') {
            if (point['pointsP1'] === 'Adv.' || (point['pointsP1'] === '40' && parseInt(point['pointsP2']) <= 30) ) {
                p1.breakPoint['all']++;
                if (point['pointWin'] === 'P1') {
                    p1.breakPoint['won']++;
                }
            }
        }
        if (point['pointWin'] === 'P1') {
            p1.total++;
        }
    }

    // stats for P2
    for (var i = 0; i < progressLen; i++) {
        var point = $scope.progress[i];
        if (point['pointServer'] === 'P2' && point['pointServeTime'] === '1st') {
            p2.firstServeIn++;
        }
        if (point['pointServer'] === 'P2') {
            p2.firstServeAll++;
        }
        if (point['pointServer'] === 'P2' && point['pointWin'] === 'P2') {
            p2.firstServeWon++;
        }
        if (point['pointServer'] === 'P2' && point['pointServeTime'] === '2nd' && point['pointWin'] === 'P2') {
            p2.secondServeWon++;
        }
        if (point['pointServer'] === 'P2' && point['pointServeTime'] === '2nd') {
            p2.secondServeAll++;
        }
        if (point['pointServer'] === 'P2' && point['pointType'] === 'ACE') {
            p2.ace++;
        }
        if (point['pointServer'] === 'P2' && point['pointDoubleFault'] === 'DF') {
            p2.doubleFault++;
        }
        if (point['pointWin'] === 'P2' && point['pointType'] === 'W') {
            p2.winner[point['pointHand']]++;
        }
        if (point['pointWin'] === 'P1' && point['pointType'] === 'UE') {
            p2.unforcedErr[point['pointHand']]++;
        }
        if (point['pointNet'] === 'P2') {
            p2.netPoint['all']++;
            if (point['pointWin'] === 'P2') {
                p2.netPoint['won']++;
            }
        }
        // break point judgement
        if (point['pointServer'] === 'P1') {
            if (point['pointsP2'] === 'Adv.' || (point['pointsP2'] === '40' && parseInt(point['pointsP1']) <= 30) ) {
                p2.breakPoint['all']++;
                if (point['pointWin'] === 'P2') {
                    p2.breakPoint['won']++;
                }
            }
        }
        if (point['pointWin'] === 'P2') {
            p2.total++;
        }

        if (point['pointServer'] === 'P2' && point['pointsP1'] === 'Adv.') {
            p1.breakPoint['all']++;
            if (point['pointWin'] === 'P1') {
                p1.breakPoint['won']++;
            }
        }
    }

    $scope.p1 = p1;
    $scope.p2 = p2;

});

ustcTennis.controller('FeedCtrl', function($scope, $stateParams, $http, $state) {
    $scope.hasNext = true;
    $scope.currentPage = $stateParams.pageNum;
    var loadFeed = function () {
        var size = 3;
        var queryStr = '/feed?begin=' + ($stateParams.pageNum - 1) * size + '&size=' + size;
        $http.get(queryStr).then(
            function(res) {
                if (res.data.length <= 1) {
                    $scope.hasNext = false;
                }
                $scope.feeds = res.data;
            }, function() {
                console.log('err');
            });
    };
    loadFeed();
    $scope.prevFeeds = function() {
        var prevPage = Math.max(1, parseInt($stateParams.pageNum) - 1);
        $state.go("feed", {pageNum: prevPage});
        loadFeed();
    };

    $scope.nextFeeds = function() {
        $state.go("feed", {pageNum: parseInt($stateParams.pageNum) + 1});
        loadFeed();
    };

});

ustcTennis.controller('MatchCtrl', function($scope, $stateParams, $http) {
    $scope.id = $stateParams.id;
    $http.get('/match?id=' + $scope.id).then(
            function(res) {
                $scope.match = res.data;
                $scope.p1 = res.data["p1_stat"];
                $scope.p2 = res.data["p2_stat"];
                // console.log(res.data);
            }, function() {
                console.log('err');
            });
});

ustcTennis.controller('PlayerCtrl', function($scope, $stateParams, $http) {
    $scope.name = $stateParams.name;

    // hide table if no player is found
    $scope.hasPlayer = function() {
        return ($scope.player != undefined) && ($scope.player.name != undefined);
    };

    $http.get('/player?name=' + $scope.name).then(
        function(res) {
            $scope.player = res.data;
        }, function() {
            console.log('err');
        });
});

ustcTennis.controller('SearchCtrl', function($scope, $location) {
    $scope.search = function() {
        $location.path('player/' + $scope.name);
    };
});

ustcTennis.controller('RankCtrl', function($scope, $http) {
    $scope.players = [];
    $http.get('/rank').then(
        function(res) {
            $scope.players = res.data;
        }, function() {
            console.log('err');
        });
});

ustcTennis.filter('feedDate', function() {
    return function(input) {
        return input.split(' ')[0];
    };
});