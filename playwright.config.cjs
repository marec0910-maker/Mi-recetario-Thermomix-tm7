const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
 testDir:'./tests', fullyParallel:true, workers:2,
 use:{baseURL:'http://127.0.0.1:8000',viewport:{width:820,height:1180},hasTouch:true, screenshot:'only-on-failure',launchOptions:process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}},
 webServer:{command:'python3 -m http.server 8000 --bind 127.0.0.1',url:'http://127.0.0.1:8000',reuseExistingServer:true},
});
