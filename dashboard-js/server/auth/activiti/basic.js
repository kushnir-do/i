'use strict';

var activiti = require('../../components/activiti');
var config = require('../../config/environment');
var async = require('async');

var guid = function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

var expiresUserInMs = function () {
  return new Date(Date.now() + 1000 * 60 * 60 * 10);
};

exports.ping = function (req, res) {
  res.send();
};

exports.logout = function (req, res) {
  var logoutRequest = {
    path: 'access/logout'
  };

  activiti.post(logoutRequest, function (error, statusCode, result, headers) {
    res.statusCode = statusCode;

    if (error) {
      res.send(error);
    } else {
      res.send(result);
    }
  });
};

exports.authenticate = function (req, res) {
  var user = req.body;

  var checkLogin = {
    path: 'access/login-v2',
    query: {
      sLogin: user.login,
      sPassword: user.password
    },
    json : true
  };

  var getUser = {
    path: 'identity/users/' + user.login,
    json : true
  };

  var getGoups = {
    path: 'action/identity/getGroups',
    query: {
      sLogin : user.login
    },
    json : true
  };

  async.waterfall([
    function (callback) {
      activiti.post(checkLogin, function (error, statusCode, result, headers) {
        if (result && result.session && Boolean(result.session) === true) {
          var jsessionCookie = headers['set-cookie'][0].split('JSESSIONID=')[1];
          callback(null, jsessionCookie);
        } else if (error) {
          callback(error, null);
        } else {
          var authError = {
            message: 'Відмовлено у авторізаціі. Перевірте логін/пароль',
            serverMessage: result ? result.message : '',
            code: result ? result.code : 0,
            statusCode: statusCode
          };
          callback(authError, null);
        }
      });
    },
    function (jsessionCookie, callback) {
      activiti.get(getUser, function (error, statusCode, result) {
        if (error) {
          callback(error, null);
        } else {
          callback(null, {jsessionCookie: jsessionCookie, userResult: result});
        }
      });
    },
    function (userWithCookie, callback) {
      activiti.get(getGoups, function (error, statusCode, result) {
        if (error) {
          callback(error, null);
        } else {
          if((typeof result == "object") && (result instanceof Array)){
            userWithCookie.userResult['roles'] = result.map(function (group) {
              return group.id;
            });
          } else {
            userWithCookie.userResult['roles'] = [];
          }

          callback(null, {
            jsessionCookie: userWithCookie.jsessionCookie,
            userResult: userWithCookie.userResult
          });
        }
      });
    }
  ], function (error, result) {
    if (error) {
      res.status(error.status ? error.status : 500).send(error);
    } else {
      req.session = result.userResult;

      // разбивка длинного массива групп на части и сохранение их в Куках
      var userGroupCookieSize = 25; // максимальное количество элементов в массиве
      var userGroupSlots = 0; // счетчик
      var indGr = 0;
      var aUserGroups = result.userResult.roles;
      while (indGr < aUserGroups.length){
        var aPartGroups = [];
        userGroupSlots++;
        for (var j = 0; j < userGroupCookieSize; j++){
          if(indGr <  aUserGroups.length){
            aPartGroups.push(aUserGroups[indGr]);
            indGr++;
          }
        }
        var sCookieName = "user_roles_part" + userGroupSlots;
        res.cookie(sCookieName, JSON.stringify({
          roles : aPartGroups
        }), {
          expires: expiresUserInMs()
        });
      }
      res.cookie('user', JSON.stringify({
        email : result.userResult.email,
        firstName : result.userResult.firstName,
        id : result.userResult.id,
        lastName : result.userResult.lastName,
        pictureUrl : result.userResult.pictureUrl,
        url : result.userResult.url,
        userGroupsSlots : userGroupSlots
      }), {
        expires: expiresUserInMs()
      });
      res.cookie('JSESSIONID', result.jsessionCookie, {
        expires: expiresUserInMs()
      });
      var sessionSettings = {
        sessionIdle: config.activiti.session.sessionIdle,
        timeOut: config.activiti.session.timeOut,
        interval: config.activiti.session.interval
      };
      res.cookie('sessionSettings', JSON.stringify(sessionSettings), {
        expires: expiresUserInMs()
      });
      res.json(result.userResult);
    }
  });
};
