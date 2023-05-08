import * as http from "http";
import * as querystring from "querystring";
import { ControllerFn } from "../types";

export const sendSingleSms: ControllerFn = async (request, response) => {
  try {
    const postData = querystring.stringify({
      token: "9a30889b4b8e33de603208c76386d896",
      to: request.body?.numbers,
      message: request.body?.message,
    });

    const options = {
      hostname: "api.greenweb.com.bd",
      path: "/api.php",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": postData.length,
      },
    };

    const req = http.request(options, function (res) {
      res.setEncoding("utf8");

      res.on("data", function (chunk) {
        console.log("BODY:", chunk);
      });

      res.on("end", function () {});
    });

    req.on("error", function (e) {
      console.log("Problem with request:", e.message);
    });

    req.write(postData);
    req.end();

    response.status(200).json({ message: "SMS Send Successfully" });
  } catch (e) {
    response.status(400).json({ message: e.message });
  }
};

