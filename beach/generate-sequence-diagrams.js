#!/usr/bin/env node

/**
 * Script per generare PlantUML Sequence Diagrams da codice TypeScript
 * 
 * Uso:
 *   node generate-sequence-diagrams.js
 * 
 * Output: diagrams/sequence-*.puml
 */

const fs = require('fs');
const path = require('path');

// Configurazione
const CONFIG = {
  routesDir: './routes',
  controllersDir: './controllers',
  outputDir: './diagrams',
};

// Parser semplice per route Express
function parseRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routes = [];

  // Regex per catturare route Express
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([a-zA-Z0-9_.]+)/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, path, handler] = match;
    routes.push({
      method: method.toUpperCase(),
      path,
      handler: handler.replace(/.*\./, ''), // rimuove prefissi tipo "authController."
      file: filePath,
    });
  }

  return routes;
}

// Parser semplice per controller
function parseController(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = [];

  // Regex per funzioni async/export
  const funcRegex = /export\s+(?:async\s+)?(?:const|function)\s+([a-zA-Z0-9_]+)/g;
  
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    
    // Cerca Model.find, Model.create, etc nel corpo della funzione
    const funcBodyRegex = new RegExp(`${funcName}[^{]*{([^}]+)}`, 's');
    const bodyMatch = content.match(funcBodyRegex);
    
    const modelCalls = [];
    if (bodyMatch) {
      const body = bodyMatch[1];
      // Cerca chiamate a Model
      const modelRegex = /([A-Z][a-zA-Z0-9]+)\.(find|findOne|findById|create|save|update|delete|aggregate)/g;
      let modelMatch;
      while ((modelMatch = modelRegex.exec(body)) !== null) {
        modelCalls.push({
          model: modelMatch[1],
          method: modelMatch[2],
        });
      }
    }

    functions.push({
      name: funcName,
      modelCalls,
    });
  }

  return functions;
}

// Genera PlantUML Sequence Diagram
function generateSequenceDiagram(route, controllerFuncs) {
  const func = controllerFuncs.find(f => f.name === route.handler);
  if (!func) return null;

  let puml = `@startuml
title ${route.method} ${route.path}

actor Client
participant "Express Router" as Router
participant "${route.handler}" as Controller
database MongoDB

Client -> Router: ${route.method} ${route.path}
Router -> Controller: ${route.handler}()
`;

  // Aggiungi chiamate ai Models
  func.modelCalls.forEach(call => {
    puml += `Controller -> MongoDB: ${call.model}.${call.method}()\n`;
    puml += `MongoDB --> Controller: result\n`;
  });

  puml += `Controller --> Router: response\n`;
  puml += `Router --> Client: JSON\n`;
  puml += `@enduml\n`;

  return puml;
}

// Scansiona tutti i file
function scanDirectory(dir, extension) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    });
  }
  
  if (fs.existsSync(dir)) {
    scan(dir);
  }
  
  return files;
}

// Main
function main() {
  console.log('🔍 Analisi routes e controllers...\n');

  // Crea output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Scansiona routes
  const routeFiles = scanDirectory(CONFIG.routesDir, '.ts');
  const allRoutes = [];
  
  routeFiles.forEach(file => {
    console.log(`📄 Parsing routes: ${file}`);
    const routes = parseRoutes(file);
    allRoutes.push(...routes);
  });

  console.log(`✅ Trovate ${allRoutes.length} routes\n`);

  // Scansiona controllers
  const controllerFiles = scanDirectory(CONFIG.controllersDir, '.ts');
  const allFunctions = [];

  controllerFiles.forEach(file => {
    console.log(`📄 Parsing controller: ${file}`);
    const funcs = parseController(file);
    allFunctions.push(...funcs);
  });

  console.log(`✅ Trovate ${allFunctions.length} controller functions\n`);

  // Genera diagrammi
  let diagramCount = 0;
  allRoutes.forEach((route, idx) => {
    const diagram = generateSequenceDiagram(route, allFunctions);
    
    if (diagram) {
      const filename = `sequence-${route.method.toLowerCase()}-${route.path.replace(/\//g, '-').replace(/:/g, '')}.puml`;
      const filepath = path.join(CONFIG.outputDir, filename);
      
      fs.writeFileSync(filepath, diagram);
      console.log(`✅ Generato: ${filename}`);
      diagramCount++;
    }
  });

  console.log(`\n🎉 Generati ${diagramCount} sequence diagrams in ${CONFIG.outputDir}/`);
  console.log('\n📖 Per visualizzare:');
  console.log('   1. Installa PlantUML extension in VS Code');
  console.log('   2. Apri i file .puml');
  console.log('   3. Premi Alt+D per preview');
  console.log('\n💡 Nota: I diagrammi generati sono una BOZZA.');
  console.log('   Perfezionali manualmente per maggiore accuratezza!');
}

// Esegui
try {
  main();
} catch (error) {
  console.error('❌ Errore:', error.message);
  process.exit(1);
}