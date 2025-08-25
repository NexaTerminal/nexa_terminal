import React from 'react';
import styles from '../../styles/DocumentGenerator/DocumentItem.module.css';

const DocumentItem = ({ template, onSelectTemplate, categoryColor }) => {
  const handleSelect = () => {
    onSelectTemplate(template);
  };

  return (
    <div className={styles.documentItemContainer} onClick={handleSelect} style={{ '--category-color': categoryColor }}>
      <h3 className={styles.templateName}>{template.name}</h3>
      <p className={styles.templateDescription}>{template.description}</p>
      <button className={styles.selectButton} style={{ backgroundColor: categoryColor }}>
        Избери образец
      </button>
    </div>
  );
};

export default DocumentItem;
