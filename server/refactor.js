const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      processDir(fullPath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 1. const express = require('express'); -> import express from 'express';
      content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"`].+?['"`])\);?/g, "import $1 from $2;");
      
      // 2. const { a, b } = require('module'); -> import { a, b } from 'module';
      content = content.replace(/const\s+(\{[\s\S]*?\})\s*=\s*require\((['"`].+?['"`])\);?/g, "import $1 from $2;");
      
      // 3. require('dotenv').config() -> import 'dotenv/config' (or leave it and just replace require with import)
      // Actually import dotenv from 'dotenv'; dotenv.config(); is better. Let's just do:
      content = content.replace(/require\(['"`]dotenv['"`]\)\.config\(\);?/g, "import dotenv from 'dotenv';\ndotenv.config();");
      
      // 4. module.exports = ... -> export default ...
      content = content.replace(/module\.exports\s*=\s*/g, "export default ");
      
      // 5. exports.name = ... -> export const name = ...
      content = content.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*/g, "export const $1 = ");

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(path.join(__dirname, 'src'));
processDir(__dirname); // for server.ts
