const { sendMail } = require("./mailer");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const { sleep } = require("./sleep");
const { readFileSync } = require("fs");
const MultiProgress = require("multi-progress");
const multi = new MultiProgress(process.stderr);

const colors = require("ansi-colors");
const { stat } = require("fs/promises");
const { inspect } = require("util");
const { join } = require("path");

exports.mailDetailData = {};
exports.mailSummaryData = { target: 0, success: 0, error: 0 };
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RESULT_DIR = "RESULT";
// main template data for mail configuration
const MAIL_CONFIG_TEMPLATE = `exports.DATA = {
  /**
   * REQUIRED !!!
   * email provider's host address.
   * Example: smtp.example.com
   */
  host: "",
  /**
   * REQUIRED !!!
   */
  port: 587,
  /**
   * REQUIRED !!!
   * set true for 465, else false.
   */
  secure: false, // true for 465, false for other ports
  /**
   * REQUIRED !!!
   */
  auth: {
    /**
     * REQUIRED !!!
     * Email address of sender
     */
    user: "",
    /**
     * REQUIRED !!!
     * Email password OR the email's App password.
     */
    pass: "",
  },
};
`;
// main template data for data file.
const DATA_TEMPLATE = `exports.DATA = {
  /**
   * OPTIONAL !!!
   * indicates whether or not to validate email addresses for its correctness.
   */
  bypass_email_address_validation: false,
  /**
   * REQUIRED !!!
   */
  to: {
    /**
     * OPTIONAL !!!
     * indicates whether an email should be sent separately/individually,
     * or at once, for the provided list below.
     *
     * NOTE: below cc and bcc addresses are applied as per this configuration.
     * Meaning, if separate is true, then below cc and bcc will be applied for
     * every mail sent to individual main/to recipient(s).
     *
     * NOTE: If the message includes several recipients then the message is
     * considered sent if at least one recipient is accepted. Thus, it is recommended
     * to send the mail separately to avoid losing track of failure recipients.
     */
    separate: true,
    /**
     * REQUIRED !!!
     * list of email addresses as main recipient(s).
     */
    list: ["one@example.com", "two@example.com"],
  },
  /**
   * OPTIONAL !!!
   */
  cc: [],
  /**
   * OPTIONAL !!!
   */
  bcc: [],
  /**
   * REQUIRED !!!
   */
  subject: "Plain text subject goes here...",
  /**
   * REQUIRED !!!
   * full file path of html file. The content of html file will be loaded
   * and sent as body in the mail.
   * Example: "index.html" OR "./folder/index.html" OR "C:\\folder\\index.html"
   */
  html: "index.html",
  /**
   * OPTIONAL !!!
   * list of attachment(s) as per below format.
   */
  attachments: [
    {
      /**
       * REQUIRED !!!
       * full file path of a attachment. If left empty, it will be ignored.
       * Example: "circular_1.pdf" OR "./folder/circular_1.pdf" OR "C:\\folder\\circular_1.pdf"
       */
      path: "",
      /**
       * OPTIONAL !!!
       * filename that appears in the mail's attachment. This is what a
       * recipient sees as the name of the attached file.
       * If left empty, the file's actual name will be used instead.
       * Example: Circular.pdf
       */
      filename: "",
      /**
       * OPTIONAL !!!
       * determines the content-type/MIME-type of a file.
       * Example: application/pdf
       *
       * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
       * Reference: https://www.iana.org/assignments/media-types/media-types.xhtml#table-application
       */
      contentType: "",
      /**
       * OPTIONAL !!!
       * unique content/file id that is used to distinguish an attachment from
       * one another. This cid can be used as reference/source in html body as well.
       * Example: LOGO
       * Usage in html: <img src="cid:LOGO">
       */
      cid: "",
    },
  ],
  /**
   * REQUIRED !!!
   * indicates the number of emails to be sent per minute. Check with your
   * Email Provider for the limit it allows.
   * Value 0 indicates no limit.
   */
  message_limit_per_minute: 30,
  /**
   * REQUIRED !!!
   * indicates the number of failure emails after which, the whole program
   * is stopped.
   * Value 0 indicates continued operation.
   */
  stop_on_failure: 0,
};`;

exports.mail = async () => {
  let bars;
  let timeTable = {};
  let thecounter = 0;
  try {
    if (!existsSync(RESULT_DIR)) {
      mkdirSync(RESULT_DIR);
    }
    if (!existsSync("mailConfig.js")) {
      writeFileSync("mailConfig.js", MAIL_CONFIG_TEMPLATE);
      return console.log(
        `Mail config file [mailConfig.js] initialized ! Please modify the values as per your requirements before using the app !`
      );
    }
    if (!existsSync("dataConfig.js")) {
      writeFileSync("dataConfig.js", DATA_TEMPLATE);
      return console.log(
        `Data file [dataConfig.js] initialized ! Please modify the values as per your requirements before using the app !`
      );
    }
    // dynamically load mail configuration file.
    delete require.cache[join(process.cwd(), "mailConfig.js")];
    const mailFile = require(join(process.cwd(), "mailConfig.js"));
    const mailConfig = mailFile.DATA;
    // validate mailConfig
    if (!mailConfig.host) {
      return console.error("No host provided in mail configuration !");
    }
    if (!mailConfig.port) {
      return console.error("No port provided in mail configuration !");
    }
    if (!mailConfig.auth) {
      return console.error("No auth config provided in mail configuration !");
    }
    if (!mailConfig.auth.user) {
      return console.error(
        "No sender email address provided in mail configuration !"
      );
    }
    if (!mailConfig.auth.pass) {
      return console.error(
        "No sender email password provided in mail configuration !"
      );
    }
    // dynamically load data configuration file.
    delete require.cache[join(process.cwd(), "dataConfig.js")];
    const dataFile = require(join(process.cwd(), "dataConfig.js"));
    const data = dataFile.DATA;
    // validate dataConfig
    if (!data.to.list.length) {
      return console.error("No recipient(s) in 'to' !");
    }
    if (!data.bypass_email_address_validation) {
      for (let email of data.to.list) {
        if (!emailRegex.test(email)) {
          return console.error(
            `'${email}' is not a valid email address [to] !`
          );
        }
      }
    }
    if (data.cc && data.cc.length && !data.bypass_email_address_validation) {
      for (let email of data.cc) {
        if (!emailRegex.test(email)) {
          return console.error(
            `'${email}' is not a valid email address [cc] !`
          );
        }
      }
    }
    if (data.bcc && data.bcc.length && !data.bypass_email_address_validation) {
      for (let email of data.bcc) {
        if (!emailRegex.test(email)) {
          return console.error(
            `'${email}' is not a valid email address [bcc] !`
          );
        }
      }
    }
    if (!data.subject) {
      return console.error("No subject !");
    }
    if (!data.html) {
      return console.error("No html path provided !");
    }
    if (!existsSync(data.html)) {
      return console.error(`File not found for the html: ${data.html} !`);
    }
    if ((await stat(data.html)).isDirectory()) {
      return console.error(
        `Path: '${data.html}' is a directory for HTML. Expected file !`
      );
    }
    if (
      data.message_limit_per_minute === undefined ||
      data.message_limit_per_minute === null
    ) {
      data.message_limit_per_minute = 0;
    }
    if (data.stop_on_failure === undefined || data.stop_on_failure === null) {
      data.stop_on_failure = 0;
    }
    for (let attachment of data.attachments) {
      if (attachment.path) {
        if (!existsSync(attachment.path)) {
          return console.error(
            `File not found for the attachment: ${attachment.path} !`
          );
        }
        if ((await stat(attachment.path)).isDirectory()) {
          return console.error(
            `Path: '${attachment.path}' is a directory. Expected file !`
          );
        }
      }
    }
    // return;
    // BEGIN
    this.mailSummaryData.target = data.to.separate ? data.to.list.length : 1;
    bars = {
      sent: {
        progress: 0, // progress in %
        bar: multi.newBar("Sent: [:bar] | :current/:total", {
          total: this.mailSummaryData.target,
          complete: colors.bgGreen(" "),
        }),
      },
      failed: {
        progress: 0, // progress in %
        bar: multi.newBar("Failed: [:bar] | :current/:total", {
          total: this.mailSummaryData.target,
          complete: colors.bgGreen(" "),
        }),
      },
      processed: {
        progress: 0, // progress in %
        bar: multi.newBar("Processed: [:bar] | :current/:total | :elapsed", {
          total: this.mailSummaryData.target,
          complete: colors.bgGreen(" "),
        }),
      },
    };
    bars.sent.bar.tick(0);
    bars.failed.bar.tick(0);
    bars.processed.bar.tick(0);
    for (let email of data.to.list) {
      let currentTimestamp = new Date().getTime();
      let currentTime = new Date(currentTimestamp).toISOString().slice(0, 16);
      if (!timeTable[currentTime]) timeTable[currentTime] = 0;
      if (timeTable[currentTime] < 30) {
        await sendMail(
          process.env.testmail || (data.to.separate ? email : data.to.list),
          data.cc || [],
          data.bcc || [],
          `${data.subject}`,
          `${readFileSync(data.html, "utf8")}`,
          data.attachments
            .filter((attachment) => attachment.path)
            .map((attachment) => {
              return {
                ...attachment,
              };
            }),
          mailConfig
        ).then((status) => {
          if (status.success) {
            this.mailSummaryData.success += 1;
            bars.sent.bar.tick(1);
          } else {
            this.mailSummaryData.error += 1;
            bars.failed.bar.tick(1);
          }
          bars.processed.bar.tick(1);
          this.mailDetailData[email] = {
            timestamp: currentTimestamp,
            sentAt: new Date(currentTimestamp).toISOString(),
            mailStatus: status,
          };
        });
        timeTable[currentTime] += 1;
        // bars.sent.bar.tick(1);
        // bars.processed.bar.tick(1);
        // break if email is supposed to be sent to all recipients at once.
        if (!data.to.separate) break;
        if (
          data.stop_on_failure &&
          data.stop_on_failure >= bars.failed.bar.curr
        )
          break;
      } else {
        await sleep(5000);
      }
      thecounter += 1;
    }
  } catch (err) {
    writeFileSync(
      join(RESULT_DIR, "mailErrorData.json"),
      JSON.stringify(
        { error: inspect(err, { depth: null, colors: false }) },
        null,
        4
      )
    );
  } finally {
    writeFileSync(
      join(RESULT_DIR, "mailSummaryData.json"),
      JSON.stringify(this.mailSummaryData, null, 4)
    );
    writeFileSync(
      join(RESULT_DIR, "mailDetailData.json"),
      JSON.stringify(this.mailDetailData, null, 4)
    );
    writeFileSync(
      join(RESULT_DIR, "mailTimeTableData.json"),
      JSON.stringify(timeTable, null, 4)
    );
  }
};

this.mail();
