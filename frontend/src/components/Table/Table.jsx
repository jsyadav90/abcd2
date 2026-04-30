/**
 * @typedef {Object} TableColumn
 * @property {string} [key]
 * @property {string} [accessor]
 * @property {string} [header]
 * @property {string} [Header]
 * @property {boolean} [sortable]
 * @property {(row: TableRow, search?: string) => any} [render]
 * @property {(row: TableRow) => string} [tooltip]
 */

/**
 * @typedef {Record<string, any> & {
 *   _id: string;
 * }} TableRow
 */

import { useMemo, useState, useEffect, useRef } from "react";
import "./Table.css";
import TableSearch from "./TableSearch";
import TablePagination from "./TablePagination";
import ColumnSort from "./ColumnSort";

/**
 * @param {{
 *   columns: TableColumn[];
 *   data?: TableRow[];
 *   pageSize?: number;
 *   showSearch?: boolean;
 *   showPagination?: boolean;
 *   onSelectionChange?: (selectedRows: string[]) => void;
 *   isRowSelectable?: (row: TableRow) => boolean;
 *   defaultSortKey?: string | null;
 *   defaultSortDirection?: "asc" | "desc";
 *   rowClassName?: (row: TableRow) => string;
 *   extraActions?: any;
 * }} props
 */
const Table = ({
  columns,
  data = [],
  pageSize = 20,
  showSearch = true,
  showPagination = true,
  onSelectionChange,
  isRowSelectable,
  defaultSortKey = null,
  defaultSortDirection = "asc",
  rowClassName,
  extraActions = null,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(() => {
    // Initialize page from URL directly to prevent initial render at page 1
    if (!showPagination) return 1;
    const params = new URLSearchParams(window.location.search);
    const urlPage = parseInt(params.get("page") ?? "1", 10);
    return (urlPage && !isNaN(urlPage) && urlPage > 0) ? urlPage : 1;
  });
  const [selectedRows, setSelectedRows] = useState(/** @type {string[]} */ ([]));

  // URL state sync for page persistence - ONLY updates when URL changes externally (like popstate)
  useEffect(() => {
    if (!showPagination) return;
    
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlPage = parseInt(params.get("page") ?? "1", 10);
      if (urlPage && !isNaN(urlPage) && urlPage > 0) {
        setPage(urlPage);
      } else {
        setPage(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showPagination]);

  const [sortConfig, setSortConfig] = useState({
    key: defaultSortKey,
    direction: defaultSortKey ? defaultSortDirection : null,
  });
  /** @type {import('react').MutableRefObject<HTMLDivElement | null>} */
  const tableContainerRef = useRef(null);
  const isFirstRender = useRef(true);

  /** @param {string | undefined} key */
  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const processedData = useMemo(() => {
    let tempData = [...data];

    if (showSearch && search && search.trim()) {
      const searchLower = search.toLowerCase().trim();

      tempData = tempData.filter((row) => {
        // Search in visible columns only
        const columnMatch = columns.some(col => {
          const fieldKey = col.key ?? col.accessor;
          if (!fieldKey) return false;

          // Check raw field value
          const fieldValue = row[fieldKey];
          const fieldText = String(fieldValue || "").toLowerCase();
          if (fieldText.includes(searchLower)) return true;

          // Also check rendered value if render function exists and doesn't return JSX
          if (col.render) {
            try {
              const renderedValue = col.render(row);
              // Skip if it's a React element or object
              if (renderedValue && typeof renderedValue === 'object' && renderedValue.$$typeof) {
                // It's a React element, skip
              } else {
                const renderedText = String(renderedValue || "").toLowerCase();
                if (renderedText.includes(searchLower)) return true;
              }
            } catch (e) {
              // Ignore render errors
            }
          }

          return false;
        });

        if (columnMatch) return true;

        // Do not use tooltip text for search matching to avoid false positives
        // (e.g. tooltip label includes 'CPU' for non-CPU rows)
        return false;
      });
    }

    if (sortConfig.key && sortConfig.direction) {
      const sortKey = sortConfig.key;
      tempData.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        return sortConfig.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return tempData;
  }, [data, search, showSearch, sortConfig]);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  /** @param {string} str */
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /** @param {any} text
   *  @param {string} searchValue
   */
  const highlightText = (text, searchValue) => {
    if (!searchValue) return text;
    const normalizedSearch = searchValue.trim();
    if (!normalizedSearch) return text;

    const regex = new RegExp(`(${escapeRegExp(normalizedSearch)})`, "gi");
    return String(text)
      .split(regex)
      .map((part, index) =>
        part.toLowerCase() === normalizedSearch.toLowerCase() ? (
          <span key={index} className="highlight">
            {part}
          </span>
        ) : (
          part
        ),
      );
  };

  const totalPages = showPagination ? Math.ceil(processedData.length / pageSize) || 1 : 1;
  const currentPage = showPagination ? Math.min(page, totalPages) : 1;

  useEffect(() => {
    if (!showPagination) return;

    const params = new URLSearchParams(window.location.search);
    const urlPage = parseInt(params.get("page") ?? "1", 10) || 1;

    if (urlPage !== currentPage) {
      if (currentPage === 1) {
        params.delete("page");
      } else {
        params.set("page", String(currentPage));
      }

      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [currentPage, showPagination]);

  useEffect(() => {
    if (!showPagination || !tableContainerRef.current) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    tableContainerRef.current.scrollTop = 0;
    tableContainerRef.current.scrollLeft = 0;
    // Removed automatic scrollIntoView as it causes unexpected page jumps
  }, [currentPage, showPagination]);

  const tableData = showPagination
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;

  const totalItems = processedData.length;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, currentPage * pageSize);

  /** @param {TableRow} row */
  const canSelectRow = (row) => !isRowSelectable || isRowSelectable(row);

  /** @param {TableRow} row */
  const toggleRow = (row) => {
    if (!canSelectRow(row)) return;
    setSelectedRows((prev) =>
      prev.includes(row._id) ? prev.filter((id) => id !== row._id) : [...prev, row._id],
    );
  };

  /** @param {boolean} checked */
  const toggleAll = (checked) => {
    const selectableRows = tableData.filter(canSelectRow);
    const pageIds = selectableRows.map((row) => row._id);
    setSelectedRows((prev) =>
      checked ? [...new Set([...prev, ...pageIds])] : prev.filter((id) => !pageIds.includes(id)),
    );
  };

  return (
    <div className="table">
      {(showSearch || showPagination || extraActions) && (
        <div className="table__options">
          <div className="table__options-left"> 
            <div className="table__actions">
              {extraActions}
            </div>

            {showSearch && (
              <TableSearch
                value={search}
                onChange={(/** @type {string} */ val) => {
                  setSearch(val);
                  setPage(1);
                }}
              />
            )}

          </div>

          <div className="table__options-right">
            {showPagination && (
            <div className="table__summary">
              {totalItems === 0 ? (
                '0 to 0 of 0'
              ) : (
                `${startIndex} to ${endIndex} of ${totalItems}`
              )}
            </div>
          )}

            {showPagination && (
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(Math.min(p, totalPages) - 1, 1))}
                onNext={() => setPage((p) => Math.min(Math.min(p, totalPages) + 1, totalPages))}
              />
            )}
          </div>
        </div>
      )}

      <div className="table__container" ref={tableContainerRef}>
        <table className="table__data">
          <thead>
            <tr>
              <th className="table__checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => toggleAll(e.target.checked)}
                  checked={
                    tableData.filter(canSelectRow).length > 0 &&
                    tableData.filter(canSelectRow).every((row) => selectedRows.includes(row._id))
                  }
                />
              </th>

              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => {
                    const sortKey = col.key ?? col.accessor;
                    if (col.sortable && sortKey) handleSort(sortKey);
                  }}
                  style={{ cursor: col.sortable ? "pointer" : "default" }}
                >
                  <span className="th-content">
                    {col.header ?? col.Header}

                    {col.sortable && sortConfig.key === (col.key ?? col.accessor) && sortConfig.direction && (
                      <ColumnSort direction={sortConfig.direction} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tableData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} align="center">
                  No data found
                </td>
              </tr>
            )}

            {tableData.map((row) => (
              <tr
                key={row._id}
                className={`${
                  selectedRows.includes(row._id)
                    ? "table__row table__row--selected"
                    : "table__row"  
                } ${rowClassName ? rowClassName(row) : ""}`}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row._id)}
                    onChange={() => toggleRow(row)}
                    disabled={!canSelectRow(row)}
                  />
                </td>

                {columns.map((col, i) => {
                  let cellTitle = "";
                  if (col.tooltip && typeof col.tooltip === 'function') {
                    try {
                      cellTitle = col.tooltip(row);
                    } catch (e) {
                      cellTitle = "";
                    }
                  }
                  
                  return (
                    <td key={i} title={cellTitle}>
                      {col.render ? col.render(row, search) : highlightText(row[col.key ?? col.accessor ?? ""], search)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
