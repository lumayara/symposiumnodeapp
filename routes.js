module.exports = function(app){
    app.post('/', async (request,response) =>{
        var insert = await createUser(request);
        //to make it work you need gmail account
        //creating function for sending emails
        var goMail = function (message) {
          if(request.user){
            const user = request.user.profile;
            //transporter is a way to send your emails
            const transporter = nodemailer.createTransport({
              service: 'Gmail',
              port:465,
              auth: {
                  user: process.env.USER_EMAIL,
                  pass: process.env.USER_PASSWORD
              },
              tls:{
                rejectUnauthorized:false
              }
            });
            // setup email data with unicode symbols
            //this is how your email are going to look like
            const mailOptions = {
                from: '"Symposium 2020" <noreply@companyinc.com>', // sender address
                to: process.env.RECEIVER, // list of receivers
                subject: 'New User Registration', // Subject line
                // text: "hi", // plain text body
                html: "Email: "+user.mail+
                      "<br>Agency:"+ request.body.agency+ "<br>RSVP: "+ request.body.rsvp+"<br>Interests: "+ request.body.interests+"<br><br>"
            };
            //this is callback function to return status to firebase console
            const getDeliveryStatus = function (error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            };
            //call of this function send an email, and return status
            transporter.sendMail(mailOptions, getDeliveryStatus);
          };
      }
        goMail();
        response.render('success');
      });
      
      app.get('/', function(req, res, next) {   
        var authorized;
        if(req.user){
          if((req.user.profile.mail).indexOf("@companyinc.com") !== -1 || (req.user.profile.mail).indexOf("company.gov") !== -1){
            authorized = true;
          }else{
            authorized = false;
          }
        }
        res.render('index', { 
          encodedJson : req.user?encodeURIComponent(JSON.stringify(req.user.profile)):"",
          authorized: authorized
        });
          
      });
       
      
      app.get('/attendees', async (request,response) => { 
        var authorized;
        if(request.user){
          if((request.user.profile.mail).indexOf("@companyinc.com") !== -1 || (request.user.profile.mail).indexOf("@company.gov") !== -1){
            authorized = true;
          }else{
            authorized = false;
          }
        }
          
        var items = await queryUsers();
        response.render('attendees', {user: request.user?request.user.profile:"", authorized: authorized, items:items});
      });
      
      app.get('/registration', function(req, res, next) {
          var authorized;
          if(req.user){
            if((req.user.profile.mail).indexOf("@companyinc.com") !== -1 || (req.user.profile.mail).indexOf("@nih.gov") !== -1){
              authorized = true;
            }else{
              authorized = false;
            }
          }
          res.render('registration', {user: req.user?req.user.profile:"", authorized: authorized});
      });
      
      app.get('/resources', (request,response) => { 
        if(request.user){
          var authorized;
          if((request.user.profile.mail).indexOf("@companyinc.com") !== -1 || (request.user.profile.mail).indexOf("@company.gov") !== -1){
            authorized = true;
          }else{
            authorized = false;
          }
          
          var itemsPDF = [];
          var itemsSlides = [];
          var files = azureFiles.fileNames; 
          files.forEach(doc => {
             var ext = doc.name.substr(doc.name.lastIndexOf('.') + 1);
            if(ext=="pdf"){
              itemsPDF.push(doc);
            }else if(ext=="ppt"||ext=="pptx"){
              itemsSlides.push(doc);
            } 
          });
          response.render('resources', {user: request.user.profile, files: files, authorized: authorized});
        }
          
      });
      
}