#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONFIG = {
  routesDir: './routes',
  controllersDir: './controllers',
  outputDir: './diagrams',
};

function parseRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routes = [];
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([\s\S]*?)\)/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const handlersRaw = match[3].split(',').map(h => h.trim());
    const handlerFull = handlersRaw.pop();
    const handler = handlerFull.split('.').pop().replace(/[()]/g, '');
    const middlewares = handlersRaw.filter(m => m && !m.includes('=>') && !m.includes('function'));

    routes.push({ method: match[1].toUpperCase(), path: match[2], handler, middlewares });
  }
  return routes;
}

function parseController(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = [];
  const funcRegex = /export\s+(?:async\s+)?(?:const|function)\s+([a-zA-Z0-9_]+)/g;
  
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    const funcBodyRegex = new RegExp(`${funcName}[^{]*{([\\s\\S]*?)^}`, 'm');
    const bodyMatch = content.match(funcBodyRegex);
    
    if (bodyMatch) {
      const body = bodyMatch[1];
      const interactions = [];

      // 1. Cattura TUTTE le chiamate ai modelli (Dinamico)
      const modelRegex = /([A-Z][a-zA-Z0-9]+)\.(find|findOne|findById|create|save|update|deleteOne|deleteMany|aggregate|findByIdAndUpdate|push)/g;
      let m;
      while ((m = modelRegex.exec(body)) !== null) {
        interactions.push({ type: 'DB', model: m[1], action: m[2] });
      }

      // 2. Cattura nuove istanze (es. new UserPreferences)
      let inst;
      const instRegex = /new\s+([A-Z][a-zA-Z0-9]+)/g;
      while ((inst = instRegex.exec(body)) !== null) {
        interactions.push({ type: 'LOGIC', label: `Initialize new ${inst[1]}` });
      }

      // 3. Rileva validazioni (if ! o return res.status(400))
      if (body.includes('res.status(400)') || body.includes('res.status(404)')) {
        interactions.push({ type: 'VALIDATION', label: 'Validate Input / Check Existence' });
      }

      functions.push({ 
        name: funcName, 
        interactions, 
        hasErrorHandling: body.includes('catch'),
        isAsync: body.includes('async')
      });
    }
  }
  return functions;
}

function generateSequenceDiagram(route, controllerFuncs) {
  const func = controllerFuncs.find(f => f.name === route.handler);
  if (!func) return null;

  let puml = `@startuml\nskinparam Style strictuml\nskinparam sequence {\n  ParticipantPadding 30\n  MessageAlign center\n}\n\n`;
  puml += `title ${route.method} ${route.path}\n\n`;
  puml += `actor Client\nparticipant "Express Router" as Router\n`;
  
  route.middlewares.forEach(m => puml += `participant "${m}" as ${m.replace(/[^a-zA-Z0-9]/g, '')}\n`);
  puml += `participant "${route.handler}" as Controller\ndatabase MongoDB\n\n`;

  puml += `Client -> Router: ${route.method} ${route.path}\nactivate Router\n`;

  // Middleware
  route.middlewares.forEach(m => {
    const mName = m.replace(/[^a-zA-Z0-9]/g, '');
    puml += `Router -> ${mName}: execute\nactivate ${mName}\n${mName} --> Router: next()\ndeactivate ${mName}\n`;
  });

  puml += `Router -> Controller: ${route.handler}()\nactivate Controller\n\nautonumber\n`;

  // Logica dinamica del controller
  func.interactions.forEach(inter => {
    if (inter.type === 'DB') {
      puml += `Controller -> MongoDB: ${inter.model}.${inter.action}()\n`;
      puml += `MongoDB --> Controller: result\n`;
    } else if (inter.type === 'LOGIC' || inter.type === 'VALIDATION') {
      puml += `note over Controller: ${inter.label}\n`;
    }
  });

  // Gestione Errori e Risposta
  if (func.hasErrorHandling) {
    puml += `\nalt success\n  Controller --> Client: res.json(data)\nelse catch (error)\n  Controller --> Client: res.status(500)\nend\n`;
  } else {
    puml += `\nController --> Client: res.json()\n`;
  }

  puml += `\ndeactivate Controller\nRouter --> Client: HTTP Response\ndeactivate Router\n@enduml\n`;
  return puml;
}

// ... Main e ScanDirectory rimangono invariati ...

function scanDirectory(dir, extension) {
  const files = [];
  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    fs.readdirSync(currentDir).forEach(item => {
      const fullPath = path.join(currentDir, item);
      if (fs.statSync(fullPath).isDirectory()) scan(fullPath);
      else if (item.endsWith(extension)) files.push(fullPath);
    });
  }
  scan(dir);
  return files;
}

function main() {
  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  const allRoutes = scanDirectory(CONFIG.routesDir, '.ts').flatMap(parseRoutes);
  const allFunctions = scanDirectory(CONFIG.controllersDir, '.ts').flatMap(parseController);

  allRoutes.forEach(route => {
    const puml = generateSequenceDiagram(route, allFunctions);
    if (puml) {
      const filename = `seq-${route.method.toLowerCase()}-${route.path.replace(/[/:]/g, '-')}.puml`.replace('--', '-');
      fs.writeFileSync(path.join(CONFIG.outputDir, filename), puml);
      console.log(`✅ Generato: ${filename}`);
    }
  });
}

main();