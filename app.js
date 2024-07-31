const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');


//set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); //directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage:storage});


//create an instance of the express
const app = express();

//create mysql connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_gradedassignment'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL', err);
        return;
    }
    console.log('Connected successfully to database');
});

//set up view engine
app.set('view engine', 'ejs');

//enable static file
app.use(express.static('public'));

app.use(express.urlencoded({
    extended: false
}))

//define routes
//------ [R] display all songs
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM songs';
    //fetch data from mysql
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving songs');
        }
        res.render('index', {songs: results});
    });
});

//------ [R] display one song
app.get('/song/:id', (req, res) => {
    //extract the song id from the request parameters
    const songid = req.params.id;
    const sql = 'SELECT * FROM songs WHERE songid = ?';
    //fetch data from mysql based on the song id
    connection.query(sql, [songid], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retriving song by ID');
        }
            //check if any song with the given id was found
        if (results.length >0) {
            res.render('song', {song: results[0]});
        } else {
            res.render('song', {song: null});
        }
    });
});

app.get('/addSong', (req, res) => {
    res.render('addSong');
});

app.post('/addSong', upload.single('image'), (req, res) => {
    //extract song data from the request body
    const {name, artist, album, lyrics, meaning} = req.body;
    let image;
    if(req.file) {
        image = req.file.filename;
    } else {
        image = null
    }
    const sql = 'INSERT INTO songs (name, artist, album, lyrics, meaning, image) VALUES (?, ?, ?, ?, ?, ?)';
    //insert the new song into the database
    connection.query(sql, [name, artist, album, lyrics, meaning, image], (error, results) => {
        if (error){
            //handle any error that occurs during the database operation
            console.error("Error adding song:", error);
            res.status(500).send('Error adding song');
        } else {
            //send a success response
            res.redirect('/');
        }
    });
});

app.get('/editSong/:id', (req, res) => {
    const songid = req.params.id;
    const sql = 'SELECT * FROM songs WHERE songid = ?';
    // fetch data from MySQL based on the song id
    connection.query(sql, [songid], (error, results) =>{
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving song by ID');
        }
        if (results.length > 0) {
            res.render('editSong', {song: results[0]});
        } else {

            res.status(404).send('Song not found');
        }
    });
});

app.post('/editSong/:id', upload.single('image'), (req, res) => {
    const songid = req.params.id;
    const {name, artist, album, lyrics, meaning} = req.body;
    let image = req.body.currentImage; 
    if (req.file) { 
        image = req.file.filename;
    }
    const sql = 'UPDATE songs SET name = ? , artist = ?, album = ?, lyrics = ?, meaning = ?, image = ? WHERE songid = ?';

    //insert the new song into the database
    connection.query(sql, [name, artist, album, lyrics, meaning, image, songid], (error, results) => {
        if (error){
            //handle any error that occurs during the database operation
            console.error("Error updating song:", error);
            res.status(500).send('Error updating song');
        } else {
            //send a success response
            res.redirect('/');
        }
    });
}); 

app.get('/deleteSong/:id',(req,res) =>{
    const songid = req.params.id;
    const sql = 'DELETE FROM songs WHERE songid = ?';
    connection.query(sql, [songid], (error, results) =>{
        if (error) {
            //handle any error that occurs during the database operation
            console.error("Error deleting song:", error);
            res.status(500).send('Error deleting song');     
        } else {
            res.redirect('/');
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`)); 