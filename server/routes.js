var     express             = require('express'),
        router              = express.Router();


router.get('/', function(req, res) {
    res.send('../public/index.html');
    // req.addListener('end', function() {
    //     res.send('../public/index.html');
    // });
});


module.exports = router;
