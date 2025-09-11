const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateOrganizationActDoc = require('../../document_templates/employment/organizationAct');

/**
 * Organization Act Controller
 * Handles hierarchical position management and validation for organizational systematization documents
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for organizational hierarchy
 */
const validateFunction = null;
/**
 * Validate individual positions
 */
function validatePositions(positions) {
  const errors = [];
  const warnings = [];
  const missing = [];
  const positionNames = new Set();

  positions.forEach((position, index) => {
    const positionPrefix = `Позиција ${index + 1}`;

    // Check required fields for each position
    if (!position.positionName || position.positionName.trim() === '') {
      missing.push(`${positionPrefix}: Име на позиција`);
    } else {
      // Check for duplicate position names
      if (positionNames.has(position.positionName.toLowerCase())) {
        errors.push(`${positionPrefix}: Дупликат име на позиција "${position.positionName}"`);
      } else {
        positionNames.add(position.positionName.toLowerCase());
      }
    }

    if (!position.numberOfEmployees || position.numberOfEmployees.trim() === '') {
      missing.push(`${positionPrefix}: Број на вработени`);
    }

    if (!position.educationRequirements || position.educationRequirements.trim() === '') {
      warnings.push(`${positionPrefix}: Препорачуваме да додадете образовни барања`);
    }

    // Validate responsibilities array
    if (!position.responsibilities || !Array.isArray(position.responsibilities) || position.responsibilities.length === 0) {
      warnings.push(`${positionPrefix}: Препорачуваме да додадете работни обврски`);
    } else {
      const emptyResponsibilities = position.responsibilities.filter(resp => !resp || resp.trim() === '');
      if (emptyResponsibilities.length > 0) {
        warnings.push(`${positionPrefix}: Некои работни обврски се празни`);
      }
    }

    // Validate reporting structure arrays
    if (position.reportsTo && !Array.isArray(position.reportsTo)) {
      errors.push(`${positionPrefix}: Извештаите до мора да биде листа`);
    }

    if (position.subordinates && !Array.isArray(position.subordinates)) {
      errors.push(`${positionPrefix}: Подредени позиции мора да биде листа`);
    }
  });

  return { errors, warnings, missing };
}

/**
 * Validate organizational hierarchy for circular references and logical structure
 */
function validateHierarchy(positions) {
  console.log('[organization-act] validateHierarchy positions type:', typeof positions);
  console.log('[organization-act] validateHierarchy positions value:', JSON.stringify(positions, null, 2));
  console.log('[organization-act] validateHierarchy is array:', Array.isArray(positions));
  
  const errors = [];
  const warnings = [];
  
  if (!Array.isArray(positions) || positions.length === 0) {
    return { errors, warnings };
  }

  // Create position name to index mapping
  const positionMap = new Map();
  positions.forEach((position, index) => {
    if (position.positionName) {
      positionMap.set(position.positionName.toLowerCase(), index);
    }
  });

  // Check each position's hierarchy
  positions.forEach((position, index) => {
    const positionName = position.positionName;
    const positionPrefix = `Позиција "${positionName}"`;

    // Check reporting relationships
    if (position.reportsTo && Array.isArray(position.reportsTo)) {
      position.reportsTo.forEach(reportTarget => {
        if (reportTarget && reportTarget.toLowerCase() === positionName.toLowerCase()) {
          errors.push(`${positionPrefix}: Позицијата не може да извештува кон себе`);
        }

        // Check if report target exists
        if (reportTarget && !positionMap.has(reportTarget.toLowerCase())) {
          warnings.push(`${positionPrefix}: Извештава кон непостоечка позиција "${reportTarget}"`);
        }
      });
    }

    // Check subordinate relationships
    if (position.subordinates && Array.isArray(position.subordinates)) {
      position.subordinates.forEach(subordinate => {
        if (subordinate && subordinate.toLowerCase() === positionName.toLowerCase()) {
          errors.push(`${positionPrefix}: Позицијата не може да биде подредена на себе`);
        }

        // Check if subordinate exists
        if (subordinate && !positionMap.has(subordinate.toLowerCase())) {
          warnings.push(`${positionPrefix}: Има подредена непостоечка позиција "${subordinate}"`);
        }
      });
    }
  });

  // Check for circular dependencies (advanced validation)
  const circularCheck = checkCircularDependencies(positions);
  if (circularCheck.length > 0) {
    errors.push(`Кружни зависности во хиерархијата: ${circularCheck.join(', ')}`);
  }

  // Check hierarchy completeness
  const orphanPositions = findOrphanPositions(positions);
  if (orphanPositions.length > 0) {
    warnings.push(`Позиции без ясна хиерархија: ${orphanPositions.join(', ')}`);
  }

  return { errors, warnings };
}

/**
 * Check for circular dependencies in reporting structure
 */
function checkCircularDependencies(positions) {
  const circularPaths = [];
  const visited = new Set();
  const recursionStack = new Set();

  // Create adjacency list for reporting relationships
  const graph = new Map();
  positions.forEach(position => {
    graph.set(position.positionName, position.reportsTo || []);
  });

  // DFS to detect cycles
  function dfs(node, path) {
    if (recursionStack.has(node)) {
      circularPaths.push(path.join(' -> ') + ' -> ' + node);
      return;
    }
    
    if (visited.has(node)) return;
    
    visited.add(node);
    recursionStack.add(node);
    
    const reportsTo = graph.get(node) || [];
    reportsTo.forEach(target => {
      if (graph.has(target)) {
        dfs(target, [...path, node]);
      }
    });
    
    recursionStack.delete(node);
  }

  positions.forEach(position => {
    if (!visited.has(position.positionName)) {
      dfs(position.positionName, []);
    }
  });

  return circularPaths;
}

/**
 * Find positions without clear hierarchical relationships
 */
function findOrphanPositions(positions) {
  const orphans = [];
  const allPositionNames = positions.map(p => p.positionName.toLowerCase());
  
  positions.forEach(position => {
    const hasReportsTo = position.reportsTo && position.reportsTo.length > 0;
    const hasSubordinates = position.subordinates && position.subordinates.length > 0;
    
    // Check if position is referenced by others
    const isReferencedAsReportTarget = positions.some(p => 
      p.reportsTo && p.reportsTo.some(target => 
        target.toLowerCase() === position.positionName.toLowerCase()
      )
    );
    
    const isReferencedAsSubordinate = positions.some(p => 
      p.subordinates && p.subordinates.some(sub => 
        sub.toLowerCase() === position.positionName.toLowerCase()
      )
    );
    
    if (!hasReportsTo && !hasSubordinates && !isReferencedAsReportTarget && !isReferencedAsSubordinate) {
      orphans.push(position.positionName);
    }
  });
  
  return orphans;
}

// Create the controller using the base factory
const organizationActController = createDocumentController({
  templateFunction: generateOrganizationActDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'organization-act',
  validateFunction: null
});

module.exports = organizationActController;