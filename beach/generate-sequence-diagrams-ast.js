#!/usr/bin/env node

/**
 * UML Sequence Diagram Generator (AST-based)
 * Express + TypeScript
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// ================= CONFIG =================
const CONFIG = {
  routesDir: "./src/routes",
  controllersDir: "./src/controllers",
  outputDir: "./docs/sequence-diagrams",
};

// ================= UTILS =================
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function scan(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    return fs.statSync(full).isDirectory()
      ? scan(full)
      : full.endsWith(".ts")
      ? [full]
      : [];
  });
}

// ================= ROUTES =================
function parseRoutes(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);

  const routes = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name.text;
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        const [pathArg, handlerArg] = node.arguments;
        if (
          ts.isStringLiteral(pathArg) &&
          ts.isPropertyAccessExpression(handlerArg)
        ) {
          routes.push({
            method: method.toUpperCase(),
            path: pathArg.text,
            handler: handlerArg.name.text,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return routes;
}

// ================= CONTROLLERS =================
function parseControllers(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);

  const controllers = [];

  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isVariableStatement(node)
    ) {
      let name, body;

      if (ts.isFunctionDeclaration(node) && node.name) {
        name = node.name.text;
        body = node.body;
      }

      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((d) => {
          if (
            ts.isIdentifier(d.name) &&
            d.initializer &&
            ts.isArrowFunction(d.initializer)
          ) {
            name = d.name.text;
            body = d.initializer.body;
          }
        });
      }

      if (name && body) {
        controllers.push({
          name,
          info: analyzeFunction(body),
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return controllers;
}

function analyzeFunction(body) {
  const input = { body: [], params: [], query: [], user: false };
  const modelCalls = [];

  function visit(node) {
    // req.body.x / req.params.x / req.query.x
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const left = node.expression.expression;
      const middle = node.expression.name.text;
      const right = node.name.text;

      if (
        ts.isIdentifier(left) &&
        left.text === "req" &&
        ["body", "params", "query"].includes(middle)
      ) {
        input[middle].push(right);
      }
    }

    // req.user
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "req" &&
      node.name.text === "user"
    ) {
      input.user = true;
    }

    // Model.method(...)
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const model = node.expression.expression;
      const method = node.expression.name.text;

      if (ts.isIdentifier(model)) {
        const fields = [];
        const arg = node.arguments[0];

        if (arg && ts.isObjectLiteralExpression(arg)) {
          arg.properties.forEach((p) => {
            if (ts.isPropertyAssignment(p)) {
              fields.push(p.name.getText());
            }
          });
        }

        modelCalls.push({
          model: model.text,
          method,
          fields,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(body);
  return { input, modelCalls };
}

// ================= UML =================
function generateDiagram(route, ctrl) {
  const f = ctrl.info;

  let uml = `@startuml
title ${route.method} ${route.path}

actor Client
participant Router
participant ${route.handler}

Client -> Router: ${route.method} ${route.path}
Router -> ${route.handler}: ${route.handler}()
`;

  if (
    f.input.body.length ||
    f.input.params.length ||
    f.input.query.length ||
    f.input.user
  ) {
    uml += `note right of ${route.handler}\n`;
    if (f.input.params.length)
      uml += `params: { ${f.input.params.join(", ")} }\n`;
    if (f.input.query.length)
      uml += `query: { ${f.input.query.join(", ")} }\n`;
    if (f.input.body.length)
      uml += `body: { ${f.input.body.join(", ")} }\n`;
    if (f.input.user) uml += `auth: user\n`;
    uml += `end note\n`;
  }

  f.modelCalls.forEach((c) => {
    uml += `${route.handler} -> ${c.model}: ${c.method}`;
    if (c.fields.length) uml += `(${c.fields.join(", ")})`;
    uml += `\n${c.model} -> MongoDB: query\n`;
    uml += `MongoDB --> ${c.model}: result\n`;
    uml += `${c.model} --> ${route.handler}: data\n`;
  });

  uml += `${route.handler} --> Router: response\n`;
  uml += `Router --> Client: JSON\n@enduml\n`;

  return uml;
}

// ================= MAIN =================
function main() {
  ensureDir(CONFIG.outputDir);

  const routes = scan(CONFIG.routesDir).flatMap(parseRoutes);
  const ctrls = scan(CONFIG.controllersDir).flatMap(parseControllers);

  routes.forEach((r) => {
    const ctrl = ctrls.find((c) => c.name === r.handler);
    if (!ctrl) return;

    const uml = generateDiagram(r, ctrl);
    const name = `sequence-${r.method.toLowerCase()}-${r.path
      .replace(/\//g, "-")
      .replace(/:/g, "")}.puml`;

    fs.writeFileSync(path.join(CONFIG.outputDir, name), uml);
    console.log(`✔ ${name}`);
  });
}

main();
