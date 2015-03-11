module.exports.makeBaseAuth = function(user, password) {
    var token = user + ':' + password;
    var hash = new Buffer(token).toString('base64');
    return 'Basic ' + hash;
}