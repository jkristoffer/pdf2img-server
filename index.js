const multiparty = require('multiparty');
const http = require('http');
const util = require('util');
const fs = require('fs');
const exec = require('child_process').exec;
const archiver = require('archiver');

let originalName, email;

http.createServer((req,res) => {
   const { url, method } = req;

   if (url === '/upload' && method === 'POST') {
      // clean up on start

      exec('rm ./tmp/* -rf', (err,stdin,stderr) => {
         console.log(err, 'in', stdin, 'err', stderr);
         uploadSeq(req,res);
      });

      return;
   }

   res.writeHead(200, {'content-type': 'text/html'});
   res.end(`
       <form action="/upload" enctype="multipart/form-data" method="post">
         <input type="text" name="email" placeholder="email" /><br/>
         <input type="file" name="upload"/><br/><br/>
         <input type="submit" value="Upload"/>
       </form>
   `);
}).listen(3005);


function uploadSeq(req, res){ 
   console.log('uploadSeq');
   const form = new multiparty.Form({
      autoFiles: true,
      uploadDir: './tmp/'
   });

   form.on('field', (name, value) => { 
      if(name == 'email') email = value || 'cattails27@gmail.com'
   });

   form.on('file', (name, file) => {
      originalName = file.originalFilename;
   });

   form.on('close', () => {
      console.log('end request');
      res.writeHead(200, {'content-type': 'text/html'});
      res.end('<p>The files will be sent to the email: '+email+'</p>');
      readConvertFileSequence(req,res);
   });

   form.parse(req, (err, fields, files) => {
      console.log('received upload:');
      console.log(err, fields, files);
   });
}

function readConvertFileSequence(req, res){
   fs.readdir('./tmp', (err, items) => {
      items.forEach(item => {
         let noExt = originalName.split('.')[0];
         noExt = noExt.replace(/ /g, '\\ ');
         item = item.replace(/ /g, '\\ ');

         const cmd = `
            mkdir ./tmp/${noExt} && \
            convert -density 150                \
                    ${__dirname}/tmp/${item}               \
                    -background white           \
                    -alpha remove               \
                    -quality 65                 \
                    ${__dirname}/tmp/${noExt}/${noExt}-%02d.jpg
         `;

         exec(cmd, (err, stdout, stderr) => {
            !!err && console.error(err);
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            zipSeq(req, res);
         });
      });
   });
}

function zipSeq(req,res) {
   const dir = originalName.split('.')[0];
   const output = fs.createWriteStream(__dirname + '/' + dir + '.zip');
   const dirEscape = dir.replace(/ /g, '\\ ');
   const archive = archiver('zip', { zlib: { level: 9 } });
   console.log('Compressing', dir);

   output.on('close', () => {
      console.log('Finished Zipping');
      const cmd = `echo "Finished converting ${dir}" | mail -s "Pdf2Img Complete" ${email} -A ${dirEscape}.zip -a "From: PDF Guy <pete@pdf2img.com>"`;
      exec(cmd, (err, stdout, stderr) => {
	 console.log('Sent mail to: ' + email);
         !!err && console.error(err);
         console.log(`stdout: ${stdout}`);
         console.log(`stderr: ${stderr}`);
	 exec(`rm ${dirEscape}.zip`, (err, stdout, stderr) => {
	   	 !!err && console.error(err);
		 console.log(`stdout: ${stdout}`);
		 console.log(`stderr: ${stderr}`);
	 });
      });
   });

   archive.pipe(output);
   archive.directory('./tmp/'+dir, false);
   archive.finalize();
   // clean up on end
   // exec('rm -r ./tmp && mkdir tmp');
}
