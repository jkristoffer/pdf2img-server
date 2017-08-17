const multiparty = require('multiparty');
const http = require('http');
const util = require('util');
const fs = require('fs');
const pdf2img = require('pdf2img');
const exec = require('child_process').exec;
const archiver = require('archiver');
const archive = archiver('zip', { zlib: { level: 9 } });

// clean up on start
exec('rm -r ./tmp && mkdir tmp');

let originalName;

pdf2img.setOptions({
   type: 'png',
   size: 1024,
   page: null
});


http.createServer((req,res) => {
   const { url, method } = req;

   if (url === '/upload' && method === 'POST') {
      res.setTimeout(3600 * 1000)
      uploadSeq(req,res);
      return;
   }

   res.writeHead(200, {'content-type': 'text/html'});
   res.end(`
       <form action="/upload" enctype="multipart/form-data" method="post">
         <input type="file" name="upload"/><br/><br/>
         <input type="submit" value="Upload"/>
       </form>
   `);
}).listen(3005);


function uploadSeq(req, res){
   const form = new multiparty.Form({
      autoFiles: true,
      uploadDir: './tmp/'
   });

   form.on('file', (name, file) => {
      originalName = file.originalFilename;
   });

   form.on('close', () => {
      readConvertFileSequence(req,res);
   });

   form.parse(req, (err, fields, files) => {
      console.log('received upload: \n\n');
   });
}

function readConvertFileSequence(req, res){
   fs.readdir('./tmp', (err, items) => {
      items.forEach(item => {
         pdf2img.setOptions({
            outputname: originalName,
            outputdir: './tmp/'+originalName.split('.')[0]
         });

         console.log('Converting', item);
         pdf2img.convert('./tmp/'+item, (err,info) => {
            err && console.error(err);
            console.log('Converting Complete', item);
            zipSeq(req, res);
         });
      });
   });
}

function zipSeq(req,res) {
   console.log('Compressing');

   archive.directory('./tmp/'+originalName, false);
   archive.finalize();
   console.log('Compressing Complete');

   res.writeHead(200, {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename='+originalName+'.zip'
   });
   archive.pipe(res);
   // clean up on end
   exec('rm -r ./tmp && mkdir tmp');
}
