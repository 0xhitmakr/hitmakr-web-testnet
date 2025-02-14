import styles from "../styles/explorer.module.css";

const HomeExplorer = ({ title, children }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.categoriesGrid}>{children}</div>
    </div>
  );
};

export default HomeExplorer;
