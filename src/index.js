import transformEs6ClassComponents from './transformers/es6Classes';
import transformFunctionalComponents from './transformers/functional';
import ReactUtils from './helpers/ReactUtils';

function addFlowComment(j, ast) {
  const getBodyNode = () => ast.find(j.Program).get('body', 0).node;

  const comments = getBodyNode().comments || [];
  const containsFlowComment = comments
    .filter(e => e.value.indexOf('@flow') !== -1)
    .length > 0;

  if (!containsFlowComment) {
    comments.unshift(j.commentBlock(' @flow '));
  }

  getBodyNode().comments = comments;
}

function removePropTypesImport(j, ast) {
  const propTypesUsed = ast
    .find(j.MemberExpression, {
      object: {
        type: 'Identifier',
        name: 'PropTypes',
      }})
    .size() > 0;
  const propTypesReassigned = ast
    .find(j.VariableDeclarator, {
      init: {
        type: 'Identifier',
        name: 'PropTypes',
      },
    }).size() > 0;

  if (!propTypesUsed && !propTypesReassigned) {
    ast.find(j.ImportSpecifier, {
      imported: {
        type: 'Identifier',
        name: 'PropTypes',
      },
    })
    .remove();
  }
}

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const reactUtils = ReactUtils(j);
  if (!reactUtils.hasReact(root) || root.find(j.TypeAlias).size() > 0) {
    return file.source;
  }

  const classModifications = transformEs6ClassComponents(root, j);
  const functionalModifications = transformFunctionalComponents(root, j);

  if (classModifications || functionalModifications) {
    addFlowComment(j, root);
    removePropTypesImport(j, root);
    return root.toSource({quote: 'single', trailingComma: true });
  } else {
    return file.source;
  }
}
