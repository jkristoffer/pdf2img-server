# pdf2img-server

Super Quick and Dirty PDF 2 Image Node Server

Load it up, it should give you a webpage with a form that expects an email address and a file upload that expects a pdf file.
Fill in the fields and submit and wait for it, this conglomerate of a project will conceive for you a `.zip` file forged from the
crisp contents of your uploaded `pdf` file.

If your `pdf` contains multiple pages, the images produced will be appended with an index of 2 digits starting from `00` to denote
the order of the pages.

# How to use?

It's failry simple, clone this project and in the project's directory, run the command `node index.js` and ... 🎉

# What do I need?

Apart from the obvious(NodesJS), it uses `imagemagick` and the `mail` command.

# Use at your own Risk 💣

This wasn't meant to be a serious project from the start but a makeshift means to a problem I had. The task was to convert massive
amounts of PDF files into images and at the same time allow it to be super easy to use for anyone. 
That resulted in said project. Finally, this project is riddled with problems and totally unsafe. You have been warned! 
