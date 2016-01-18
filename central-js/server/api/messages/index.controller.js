var request = require('request');
var _ = require('lodash');

function getOptions(req) {
    var config = require('../../config/environment');
    var activiti = config.activiti;

    return {
        protocol: activiti.protocol,
        hostname: activiti.hostname,
        port: activiti.port,
        path: activiti.path,
        username: activiti.username,
        password: activiti.password
    };
}

module.exports.post = function(req, res) {
    //options, callback
    var options = getOptions(req);
    var url = options.protocol + '://' + options.hostname + options.path + '/subject/message/setMessage';

    var data = req.body;

    var callback = function(error, response, body) {
        res.send(body);
        res.end();
    };

    return request.post({
        'url': url,
        'auth': {
            'username': options.username,
            'password': options.password
        },
        'qs': {
            'sMail': data.sMail,
            'sHead': data.sHead,
            'sBody': data.sBody
        }
    }, callback);
};

module.exports.get = function(req, res) {
    //options, callback
    var options = getOptions(req);
    var url = options.protocol + '://' + options.hostname + options.path + '/subject/message/getMessages';

    var callback = function(error, response, body) {
        res.send(body);
        res.end();
    };

    return request.get({
        'url': url,
        'auth': {
            'username': options.username,
            'password': options.password
        }
    }, callback);
};

module.exports.findFeedback = function(req, res){

  var options = getOptions(req);
  var url = options.protocol + '://'
    + options.hostname
    + options.path
    + '/subject/message/getMessageFeedbackExtended?sID_Order='
    + req.param('sID_Order')
    + '&sToken='+req.param('sToken');

  var callback = function(error, response, body) {
    res.send(body);
    res.end();
  };

  return request.get({
    'url': url,
    'auth': {
      'username': options.username,
      'password': options.password
    }
  }, callback);
};

module.exports.postFeedback = function(req, res){
  var options = getOptions(req);
  var url = options.protocol + '://' + options.hostname + options.path + '/subject/message/setMessageFeedbackExtended';

  var data = req.body;

  var callback = function(error, response, body) {
    res.send(body);
    res.end();
  };

  return request.post({
    'url': url,
    'auth': {
      'username': options.username,
      'password': options.password
    },
    'qs': {
      'sID_Order': data.sID_Order,
      'sToken': data.sToken,
      'sBody': data.sBody
    }
  }, callback);
};

module.exports.postServiceMessage = function(req, res){
  var options = getOptions(req);
  var url = options.protocol + '://' + options.hostname + options.path + '/subject/message/setServiceMessage';

  var data = req.body;
  var callback = function(error, response, body) {
    res.send(body);
    res.end();
  };

  return request.post({
    'url': url,
    'auth': {
      'username': options.username,
      'password': options.password
    },
    'qs': {
      'sID_Order': data.sID_Order,
      'sBody': data.sBody,
      'nID_SubjectMessageType' : 8
    }
  }, callback);
};

module.exports.findServiceMessages = function(req, res){
  if (!!req.session.subject.nID){
    var options = getOptions(req);
    var nID_Subject = req.session.subject.nID;
    var url = options.protocol + '://'
      + options.hostname
      + options.path
      + '/subject/message/getServiceMessages?sID_Order='
      + req.param('sID_Order')
      + '&nID_Subject=' + nID_Subject
      ;

    var callback = function(error, response, body) {
      var sessionId = req.session.subject.nID;
      var filtered = _.filter(JSON.parse(body), function(obj){
        //return obj.nID_Subject === sessionId;
        return true;
      });
      res.send(filtered);
      res.end();
    };

    return request.get({
      'url': url,
      'auth': {
        'username': options.username,
        'password': options.password
      }
    }, callback);
  } else {
    res.end();
  }

};
