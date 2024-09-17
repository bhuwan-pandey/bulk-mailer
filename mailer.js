const nodemailer = require("nodemailer");

exports.sendMail = async (
  // const sendMail = async (
  to,
  cc = [],
  bcc = [],
  subject,
  html,
  attachments = [],
  config = {
    host: "",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "",
      pass: "",
    },
  }
) => {
  const transporter = nodemailer.createTransport(config);
  const mailOptions = {
    from: config.auth.user,
    to: process.env.testmail || to,
    cc: [process.env.testmail].filter(Boolean).length
      ? [process.env.testmail].filter(Boolean)
      : cc,
    bcc: [process.env.testmail].filter(Boolean).length
      ? [process.env.testmail].filter(Boolean)
      : bcc,
    subject: subject,
    html: html,
    attachments: attachments,
  };
  return await transporter
    .sendMail(mailOptions)
    // , (error, info) => {
    //   console.log(error ? "Error:> " + error : "Info:> " + info.response, to);
    //   if (error) {
    //     return { success: false, message: error };
    //   } else {
    //     return { success: true, message: info.response };
    //   }
    // }
    .then((info) => {
      //   console.log(info, "info");
      //   console.log("Info:> " + info.response, to);
      return { success: true, message: info };
    })
    .catch((err) => {
      //   console.log("Error:> " + err, to);
      return { success: false, message: err };
    });
};

// this.sendMail(
//   "",
//   [],
//   [],
//   "This is a subject",
//   `<p>This is html</p>`,
//   [
//     // attachment
//     // {
//     //   filename: "contract.pdf",
//     //   content: fs.readFileSync("report.pdf"),
//     //   contentType: "application/pdf",
//     // },
//   ]
// );
