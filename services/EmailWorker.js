const { Worker } = require('node:worker_threads');
const path = require('path');

const createEmailWorker = (emailData) => {
  const emailWorkerPath = path.join(__dirname, '..', 'utils', 'email_worker.js');
  const emailWorker = new Worker(emailWorkerPath, { workerData: emailData });
  emailWorker.on('message', (message) => {
    if (message.success) {
      console.log('Email sent successfully');
      console.log(message.result);
    } else {
      console.error('Error sending email');
      console.error(message.error);
    }
  });

  emailWorker.on('error', (error) => {
    console.error('Email worker error');
    console.error(error);
  });

  emailWorker.on('exit', (code) => {
    console.log(`Email worker exited with code ${code}`);
  });

  return emailWorker;
};

module.exports = { createEmailWorker };
