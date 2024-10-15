(async () => {
  const chalk = await import('chalk').then(module => module.default);
  const express = require("express");
  const crypto = require("crypto");
  const axios = require("axios");

  const app = express();
  const port = 9999;

  // Function that sends the message repeatedly
  const sendMessage = async (username, message, amount) => {
    let successCount = 0;
    let failureCount = 0;
    let counter = 0;

    while (counter < amount) {
      try {
        const date = new Date();
        const formattedDate = date.toTimeString().split(' ')[0]; // HH:MM:SS
        const deviceId = crypto.randomBytes(21).toString('hex');

        const url = "https://ngl.link/api/submit";
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Referer": `https://ngl.link/${username}`,
          "Origin": "https://ngl.link"
        };

        const body = `username=${username}&question=${encodeURIComponent(message)}&deviceId=${deviceId}`;

        const response = await axios.post(url, body, { headers });

        if (response.status !== 200) {
          console.log(chalk.red(`[ERROR] [${formattedDate}] [${counter + 1}/${amount}] - [${username}]`));
          failureCount++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds to avoid rate-limiting
        } else {
          successCount++;
          counter++;
          console.log(
            chalk.green(`[SUCCESS] `) +
            chalk.yellow(`[${formattedDate}] `) +
            chalk.hex('#FFA500')(`[${counter}/${amount}] `) + // Orange for count
            chalk.blue(`[${username}]`)
          );
        }
      } catch (error) {
        console.error(chalk.red(`[ERROR] [${formattedDate}] [${counter + 1}/${amount}] - [${username}]`));
        failureCount++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds to avoid errors
      }
    }

    return { successCount, failureCount };
  };

  app.get("/ngl", async (req, res) => {
    const username = req.query.u;
    const message = req.query.m;
    const amount = parseInt(req.query.a, 10);

    // Validate parameters
    if (!username || !message || isNaN(amount) || amount <= 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).send(
        JSON.stringify({
          result: {
            error: "Invalid query parameters. Make sure 'u' (username), 'm' (message), and 'a' (amount) are properly specified."
          }
        }, null, 2) // Pretty print with indentation
      );
    }

    try {
      const { successCount, failureCount } = await sendMessage(username, message, amount);

      // Respond with the custom JSON format
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(
        JSON.stringify({
          result: {
            status: "success",
            message: `Spammed ${username} ${successCount} out of ${amount} times.`,
            success: successCount,
            failed: failureCount,
            author: "Zishin Ishikaze"
          }
        }, null, 2) // Pretty print with indentation
      );
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).send(
        JSON.stringify({
          result: {
            status: "error",
            message: "An error occurred while processing your request, please try again later!",
            author: "Zishin Ishikaze",
            details: error.message
          }
        }, null, 2) // Pretty print with indentation
      );
    }
  });

  // Start the server
  app.listen(port, () => {
    console.log(chalk.green(`Server is running on http://localhost:${port}`));
  });
})();

