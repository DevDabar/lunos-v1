//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const  passportLocalMongoose = require("passport-local-mongoose");

const fs = require("fs");
const path = require("path");


const multer = require('multer');
 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
const upload = multer({ storage: storage });

const storageMenus = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/menus')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const uploadMenus = multer({ storage: storageMenus });


/* el paquete de bcrypt no se usara de esta manera, dado que local mongoose tiene hash y bcrypt incorporado*/
//const bcrypt = require("bcrypt");
//const saltRound = 10;

const app = express();

mongoose.set('strictQuery', false);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());


app.use(session({
    secret: "Thisisourlittlesecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


////////////////////////////////////////////////////////////////////////////////////////////////////////
//Start conection with database mongo using mongoose
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(process.env.URL_DB);
    console.log("Database conected");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
const userSchema = new mongoose.Schema ({
    nombre: String,
    apellido: String,
    dia: String,
    mes: String,
    año: String,
    genero: String,
    telefono: String,
    username: String,
    email: String,
    password: String,
    img: {
        data: Buffer,
        contentType: String
    }
});

const menuSchema = new mongoose.Schema ({
    nombre: String,
    descripcion: String,
    img: {
        data: Buffer,
        contentType: String
    },
    _idUser: mongoose.ObjectId
});



userSchema.plugin(passportLocalMongoose); //hash y salt 
////////////////////////////////////////////////////////////////////////////////////////////////////////
const User = mongoose.model("User", userSchema);

const Menu = mongoose.model("Menu", menuSchema);

////////////////////////////////////////////////////////////////////////////////////////////////////////

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});



app.get("/", function(req,res){
    
    anyFailLog(req);
    if(req.isAuthenticated()){
        res.render("home", {userLogIn: true, messageActive: false, messageContent: ""});
    } else {        
        res.render("home", {userLogIn: false, messageActive: false, messageContent: "usuario agregado"});
    }    
});

app.get("/crear-cuenta", function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/");        
    } else {
        res.render("crear-cuenta", {userLogIn: false, messageActive: false, messageContent: ""});
    } 
});
app.post("/crear-cuenta", function(req,res){   
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(!err){             
                passport.authenticate("local")(req,res,function(){
                res.redirect("/menu");
                });
        } else {
            console.log(err);
            res.redirect("/");
        }
    });
});
/*------------------------------------------------------------*/

app.get("/iniciar-sesion", function(req,res){
    res.render("iniciar-sesion", {userLogIn: false, messageActive: false, messageContent: ""});
});

app.get("/cerrar-sesion", function(req,res){
    req.logout(function(err){
        if(!err){
            res.redirect("/");
        } else{
            console.log(err);
        }
    });
});

app.post("/iniciar-sesion", function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local", { failureRedirect: '/', failureMessage: true })(req,res,function(){
                res.redirect("/menu");
            });            
        }
    });

});

app.get("/menu", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    Menu.find(function(err,foundMenu){
                        if(err){
                            console.log(err);
                        } else {
                            if(foundMenu){
                                res.render("menu", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser, menu: foundMenu});
                            }
                        }
                    });
                }
            }
        });
    } else {
        res.redirect("/iniciar-sesion");
    }
});

app.get("/settings", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    Menu.find({ _idUser: req.user.id},function(err,foundMenu){
                        if(err){
                            console.log(err);
                        } else {
                            if(foundMenu){
                                res.render("settings", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser, menu: foundMenu});
                            }
                        }
                    });
                }
            }
        });
    } else {
        res.redirect("/");
    }
})

app.get("/settings-basic", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-basic", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-date", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-date", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-gender", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-gender", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-email", function(req,res){
    if(req.isAuthenticated()){        
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-email", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-phone", function(req,res){
    if(req.isAuthenticated()){        
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-phone", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-image", function(req,res){
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-image", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/settings-menu", function(req,res){
    if(req.isAuthenticated()){       
        User.findById(req.user.id,function(err,foundUser){
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    res.render("settings-update/settings-menu", {userLogIn: true, messageActive: false, messageContent: "", user: foundUser});
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/:_id&:type", function(req,res){
    if(req.isAuthenticated()){       
        const requestId = req.params._id;
        const requestType = req.params.type;

        Menu.findById(requestId,function(err,foundMenu){
            if(err){
                console.log(err);
            } else {
            if(foundMenu){
                if(requestType == "1"){
                    res.render("settings-update/settings-item", {userLogIn: true, messageActive: false, messageContent: "", menu: foundMenu});
                } else if(requestType == "2"){
                    res.render("settings-update/settings-item-delete", {userLogIn: true, messageActive: false, messageContent: "", menu: foundMenu});
                    }
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.post("/settings-basic", function(req,res){
    
    const NewNombre = req.body.nombre;
    const NewApellido = req.body.apellido;
    const newUsername = req.body.username;

    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.nombre = NewNombre;
                foundUser.apellido = NewApellido;
                foundUser.username = newUsername;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-date", function(req,res){
    
    const NewDia = req.body.dia;
    const NewMes = req.body.mes;
    const newAño = req.body.año;
    
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.dia = NewDia;
                foundUser.mes = NewMes;
                foundUser.año = newAño;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-gender", function(req,res){
    const NewGenero = req.body.genero;    
    
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.genero = NewGenero;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-email", function(req,res){
    const NewEmail = req.body.email;    
    
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.email = NewEmail;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-phone", function(req,res){
    const NewTelefono = req.body.telefono;    
    
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.telefono = NewTelefono;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-image", upload.single('image') ,function(req,res){

    let img = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/profile/' + req.file.filename)),
        contentType: 'image/png'
    }
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.img = img;
                foundUser.save(function(){
                    res.redirect("/settings");
                });
            }
        }
    });
});

app.post("/settings-menu", uploadMenus.single('image') ,function(req,res){

    let img = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/menus/' + req.file.filename)),
        contentType: 'image/png'
    }
        
    const NewNombre = req.body.nombre; 
    const NewDescripcion = req.body.descripcion; 
    
    const menu = new Menu ({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        img: img,
        _idUser: req.user.id
    });
    
    menu.save();
    res.redirect("/settings");
});

app.post("/:_id", uploadMenus.single('image') ,function(req,res){
    const requestId = req.params._id;
    const NewNombre = req.body.nombre;
    const NewDescripcion = req.body.descripcion;
    if(req.file){
        let img = {
            data: fs.readFileSync(path.join(__dirname + '/uploads/menus/' + req.file.filename)),
            contentType: 'image/png'
        }
        Menu.findById(requestId,function(err,foundMenu){
            if(err){
                console.log(err);
            } else {
                if(foundMenu){
                    foundMenu.nombre = NewNombre;
                    foundMenu.descripcion = NewDescripcion;
                    foundMenu.img = img;
                    foundMenu.save(function(){
                        res.redirect("/settings");
                    });
                }
            }
        });
        
    } else {
        Menu.findById(requestId,function(err,foundMenu){
            if(err){
                console.log(err);
            } else {
                if(foundMenu){
                    foundMenu.nombre = NewNombre;
                    foundMenu.descripcion = NewDescripcion;
                    foundMenu.save(function(){
                        res.redirect("/settings");
                    });
                }
            }
        });
    }
    
});

app.post("/del/:_id", function(req,res){
    const requestId = req.params._id;
    Menu.deleteOne(
        {_id: requestId},
        function(err){
            if(!err){
                res.redirect("/settings");
            }
            else{
                console.log(err);
            }
        }
    );    
});


app.get("/item-view", function(req,res){
    if(req.isAuthenticated()){
        res.render("item-view");
    } else {
        res.redirect("/iniciar-sesion");
    }
});


let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("server has been started");
});


function anyFailLog (req){
    let sesion_message = req.session.messages;
    if(sesion_message){                 //existe la propiedad mensaje: se intento iniciar sesión
        //console.log(sesion_message[0]); //session_message[0] -> Password or username is incorrect
        console.log(sesion_message[0]);
        req.logout(function(err){
            if(err){
                console.log(err);
            }
        });

    } else {                            //no existe la propiedad mensaje: no se intento iniciar sesión
        //No hacer nada comportamiento normal
        
    } 
}