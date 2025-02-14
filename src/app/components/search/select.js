import { ChevronDown } from "lucide-react";
import styles from "./search.module.css";

const SearchSelect = ({ value, onChange }) => {
  return (
    <div className={styles.selectWrapper}>
      <select
        className={styles.select}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="title">Title</option>
        <option value="hashtags">Hashtags</option>
        <option value="dsrcid">Dsrc Id</option>
        <option value="user">User/Artist</option>
      </select>
      <span>
        <ChevronDown />
      </span>
    </div>
  );
};

export default SearchSelect;
