import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';
import moment from 'moment';

/**
 * Interactive Organization Act Preview Component
 * Features:
 * - Hierarchical tree structure visualization
 * - Drag-and-drop position reordering
 * - Clickable position cards with edit modals
 * - Modern, engaging UI design
 */
const OrganizationActPreview = ({ formData, currentStep, onChange }) => {
  const { currentUser } = useAuth();
  const company = currentUser?.companyInfo || {};
  
  // State for modal and drag operations
  const [editingPosition, setEditingPosition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragCounter = useRef(0);

  // Enhanced positions data with hierarchy support
  const [hierarchyData, setHierarchyData] = useState(() => {
    if (!formData.positions || formData.positions.length === 0) {
      return [];
    }
    
    return formData.positions.map((pos, index) => ({
      ...pos,
      level: 0, // Root level by default
      parentId: null,
      expanded: true,
      index
    }));
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return moment(dateString).isValid() ? moment(dateString).format('DD.MM.YYYY') : dateString;
  };

  // Handle position card click
  const handlePositionClick = (position) => {
    setEditingPosition({ ...position });
    setShowModal(true);
  };

  // Handle modal save
  const handleModalSave = () => {
    if (!editingPosition) return;

    const updatedPositions = formData.positions.map(pos => 
      pos.id === editingPosition.id ? editingPosition : pos
    );
    
    onChange('positions', updatedPositions);
    
    // Update hierarchy data
    setHierarchyData(prev => prev.map(item => 
      item.id === editingPosition.id ? { ...item, ...editingPosition } : item
    ));
    
    setShowModal(false);
    setEditingPosition(null);
  };

  // Handle position hierarchy changes
  const movePosition = useCallback((sourceIndex, targetIndex, makeChild = false) => {
    if (sourceIndex === targetIndex) return;
    
    const newHierarchy = [...hierarchyData];
    const [movedItem] = newHierarchy.splice(sourceIndex, 1);
    
    if (makeChild && targetIndex < newHierarchy.length) {
      movedItem.parentId = newHierarchy[targetIndex].id;
      movedItem.level = newHierarchy[targetIndex].level + 1;
    } else {
      movedItem.parentId = null;
      movedItem.level = 0;
    }
    
    newHierarchy.splice(targetIndex, 0, movedItem);
    setHierarchyData(newHierarchy);
    
    // Update form data
    const updatedPositions = newHierarchy.map(item => ({
      id: item.id,
      positionName: item.positionName,
      numberOfEmployees: item.numberOfEmployees,
      educationRequirements: item.educationRequirements,
      experienceRequirements: item.experienceRequirements,
      responsibilities: item.responsibilities
    }));
    
    onChange('positions', updatedPositions);
  }, [hierarchyData, onChange]);

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== targetIndex) {
      const makeChild = e.ctrlKey || e.metaKey; // Hold Ctrl/Cmd to make subordinate
      movePosition(draggedItem, targetIndex, makeChild);
    }
    setDraggedItem(null);
    setDropTarget(null);
    dragCounter.current = 0;
  };

  // Toggle position expansion
  const toggleExpansion = (id) => {
    setHierarchyData(prev => prev.map(item => 
      item.id === id ? { ...item, expanded: !item.expanded } : item
    ));
  };

  // Render position card with modern styling
  const renderPositionCard = (position, index) => {
    const hasChildren = hierarchyData.some(p => p.parentId === position.id);
    const isExpanded = position.expanded;
    const isDragging = draggedItem === index;
    const isDropTarget = dropTarget === index;
    
    return (
      <div
        key={position.id}
        className={`${styles.orgPositionCard} ${isDragging ? styles.dragging : ''} ${isDropTarget ? styles.dropTarget : ''}`}
        style={{ 
          marginLeft: `${position.level * 30}px`,
          transform: isDragging ? 'rotate(5deg) scale(1.05)' : 'none'
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => handlePositionClick(position)}
      >
        <div className={styles.positionHeader}>
          {hasChildren && (
            <button
              className={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(position.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          <div className={styles.positionInfo}>
            <h4 className={styles.positionTitle}>
              {position.positionName || '[Име на позиција]'}
            </h4>
            <p className={styles.positionSubtitle}>
              {position.numberOfEmployees || '[Број на вработени]'} вработени
            </p>
          </div>
          
          <div className={styles.positionActions}>
            <div className={styles.hierarchyLevel}>
              Ниво {position.level + 1}
            </div>
            <button className={styles.dragHandle} title="Повлечи за преместување">
              ⋮⋮
            </button>
          </div>
        </div>
        
        {position.educationRequirements && (
          <div className={styles.positionDetail}>
            <strong>Образование:</strong> {position.educationRequirements}
          </div>
        )}
        
        {position.experienceRequirements && (
          <div className={styles.positionDetail}>
            <strong>Искуство:</strong> {position.experienceRequirements}
          </div>
        )}
        
        <div className={styles.positionFooter}>
          <span className={styles.editHint}>Кликнете за уредување</span>
        </div>
      </div>
    );
  };

  // Filter positions to show only expanded items
  const getVisiblePositions = () => {
    const visible = [];
    
    const addVisibleChildren = (parentId, level) => {
      const children = hierarchyData.filter(p => p.parentId === parentId);
      children.forEach(child => {
        visible.push(child);
        if (child.expanded) {
          addVisibleChildren(child.id, level + 1);
        }
      });
    };
    
    // Add root level positions
    const rootPositions = hierarchyData.filter(p => p.parentId === null);
    rootPositions.forEach(pos => {
      visible.push(pos);
      if (pos.expanded) {
        addVisibleChildren(pos.id, 0);
      }
    });
    
    return visible;
  };

  // Show empty state or loading
  if (!formData.positions || formData.positions.length === 0) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.document}>
          <h2 className={styles.title}>АКТ ЗА СИСТЕМАТИЗАЦИЈА НА РАБОТНИТЕ МЕСТА</h2>
          <div className={styles.companyInfo}>
            <p className={styles.greyedText}>
              Друштво: <span className={styles.highlightedInput}>{company?.companyName || '[Име на компанија]'}</span>
            </p>
            <p className={styles.greyedText}>
              Адреса: <span className={styles.highlightedInput}>{company?.address || '[Адреса на компанија]'}</span>
            </p>
            <p className={styles.greyedText}>
              Датум: <span className={styles.highlightedInput}>{formatDate(formData.documentDate) || '[Датум на документ]'}</span>
            </p>
          </div>
          
          <div className={styles.emptyOrgChart}>
            <div className={styles.emptyStateIcon}>📋</div>
            <h3>Организациона структура</h3>
            <p>Додајте работни позиции за да видите интерактивна организациона шема</p>
            <div className={styles.orgChartPlaceholder}>
              <div className={styles.placeholderBox}>
                <span>Управител / Директор</span>
              </div>
              <div className={styles.placeholderLine}></div>
              <div className={styles.placeholderChildren}>
                <div className={styles.placeholderBox}>Одделение 1</div>
                <div className={styles.placeholderBox}>Одделение 2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visiblePositions = getVisiblePositions();

  return (
    <div className={styles.previewContainer}>
      <div className={styles.document}>
        <h2 className={styles.title}>АКТ ЗА СИСТЕМАТИЗАЦИЈА НА РАБОТНИТЕ МЕСТА</h2>
        
        <div className={styles.companyInfo}>
          <p className={styles.greyedText}>
            Друштво: <span className={styles.highlightedInput}>{company?.companyName || '[Име на компанија]'}</span>
          </p>
          <p className={styles.greyedText}>
            Адреса: <span className={styles.highlightedInput}>{company?.address || '[Адреса на компанија]'}</span>
          </p>
          <p className={styles.greyedText}>
            Датум: <span className={styles.highlightedInput}>{formatDate(formData.documentDate) || '[Датум на документ]'}</span>
          </p>
        </div>

        <div className={styles.interactiveOrgChart}>
          <div className={styles.orgChartHeader}>
            <h3>📊 Интерактивна организациона структура</h3>
            <p className={styles.orgChartInstructions}>
              💡 Кликнете на позиција за уредување • Повлечете за преместување • Држете Ctrl за хиерархија
            </p>
          </div>
          
          <div className={styles.orgChartContent}>
            {visiblePositions.map((position, index) => 
              renderPositionCard(position, hierarchyData.indexOf(position))
            )}
          </div>
          
          <div className={styles.orgChartSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryNumber}>{formData.positions.length}</span>
              <span className={styles.summaryLabel}>Вкупно позиции</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryNumber}>
                {formData.positions.reduce((sum, pos) => {
                  const num = parseInt(pos.numberOfEmployees?.match(/\d+/)?.[0] || '0');
                  return sum + num;
                }, 0)}
              </span>
              <span className={styles.summaryLabel}>Вкупно вработени</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Position Modal */}
      {showModal && editingPosition && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.positionModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✏️ Уредување на позиција</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Име на позиција *</label>
                <input
                  type="text"
                  value={editingPosition.positionName || ''}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    positionName: e.target.value
                  })}
                  className={styles.input}
                  placeholder="пр. Главен оперативен директор"
                />
              </div>

              <div className={styles.field}>
                <label>Број на вработени *</label>
                <input
                  type="text"
                  value={editingPosition.numberOfEmployees || ''}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    numberOfEmployees: e.target.value
                  })}
                  className={styles.input}
                  placeholder="пр. 1 (еден)"
                />
              </div>

              <div className={styles.field}>
                <label>Образовни барања</label>
                <textarea
                  value={editingPosition.educationRequirements || ''}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    educationRequirements: e.target.value
                  })}
                  className={styles.textarea}
                  rows={3}
                  placeholder="пр. Да има завршено високо образование..."
                />
              </div>

              <div className={styles.field}>
                <label>Барања за работно искуство</label>
                <textarea
                  value={editingPosition.experienceRequirements || ''}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    experienceRequirements: e.target.value
                  })}
                  className={styles.textarea}
                  rows={2}
                  placeholder="пр. работно искуство од најмалку 5 години..."
                />
              </div>

              <div className={styles.field}>
                <label>Работни обврски</label>
                <textarea
                  value={editingPosition.responsibilities || ''}
                  onChange={(e) => setEditingPosition({
                    ...editingPosition,
                    responsibilities: e.target.value
                  })}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Детално опишете ги работните обврски..."
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Откажи
              </button>
              <button 
                className={styles.saveBtn}
                onClick={handleModalSave}
              >
                💾 Зачувај
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationActPreview;