exports.DATA = {
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
