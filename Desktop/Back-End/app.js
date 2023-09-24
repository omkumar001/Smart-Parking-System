const http = require('http');

const server = http.createServer((req,res)=>{

    res.setHeader('Content-Type', 'text/html');
    res.write(`<h3>Shashwat Mishra</h3>`);
    res.end();
});

server.listen('3000','127.0.0.1',()=>{
    console.log("Listening on port 80")
});