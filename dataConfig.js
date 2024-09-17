exports.DATA = {
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
};
