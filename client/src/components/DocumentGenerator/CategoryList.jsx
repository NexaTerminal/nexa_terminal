import React from 'react';
import styles from '../../styles/DocumentGenerator/CategoryList.module.css';

const CategoryList = ({ categories, onSelectCategory, selectedCategory }) => {
  return (
    <div className={styles.categoryListContainer}>
      <h2 className={styles.title}>Категории на документи</h2>
      <div className={styles.grid}>
        {Object.entries(categories).map(([key, category]) => (
          <div 
            key={key} 
            className={`${styles.categoryItem} ${selectedCategory === key ? styles.selected : ''}`}
            onClick={() => onSelectCategory(key)}
            style={{borderColor: category.color}}
          >
            <div className={styles.icon} style={{backgroundColor: category.color}}>{category.icon}</div>
            <h3 className={styles.categoryTitle}>{category.title}</h3>
            <p className={styles.categoryDescription}>{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
