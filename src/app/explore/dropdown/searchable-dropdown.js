import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import styles from "./searchable-dropdown.module.css";
import { convertCountryData } from "@/lib/metadata/CountryData";

export default function SearchableDropdown({
  placeholder = "Search...",
  onChange,
  country,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  const options = useMemo(() => {
    return convertCountryData();
  }, []);

  const filteredOptions = options.filter((option) => {
    return option?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase());
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setSearchTerm("");
    setIsOpen(false);
    onChange?.(option.value);
  };

  useEffect(() => {
    const setSelectedLOcation = () => {
      const data = options.filter((option) => {
        return option?.value?.toLowerCase() === country;
      });

      setSelectedOption(data[0]);
    };
    setSelectedLOcation();
  }, [country]);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.selectedValue}>
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronUp : ""}`}
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.option} ${
                    selectedOption?.value === option.value
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className={styles.noResults}>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
