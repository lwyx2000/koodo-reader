import React from "react";
import "./booklist.css";
import BookCardItem from "../../../components/bookCardItem";
import BookCoverItem from "../../../components/bookCoverItem";
import BookListItem from "../../../components/bookListItem";
import BookModel from "../../../models/Book";
import { Trans } from "react-i18next";
import { BookListProps, BookListState } from "./interface";
import { Redirect, withRouter } from "react-router-dom";
import ViewMode from "../../../components/viewMode";
import {
  ConfigService,
  SortUtil,
} from "../../../assets/lib/kookit-extra-browser.min";
import toast from "react-hot-toast";
import BookUtil from "../../../utils/file/bookUtil";
import CoverUtil from "../../../utils/file/coverUtil";
import DatabaseService from "../../../utils/storage/databaseService";

class BookList extends React.Component<BookListProps, BookListState> {
  constructor(props: BookListProps) {
    super(props);
    this.state = { 
      isRefreshing: false,
      isMultiSelect: false 
    };
  }
  UNSAFE_componentWillMount() {
    this.props.handleFetchBooks();
  }
  UNSAFE_componentWillReceiveProps() {
    this.setState({ isRefreshing: true }, () => {
      this.setState({ isRefreshing: false });
    });
  }
  isElementInViewport = (element) => {
    const rect = element.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };
  handleKeyFilter = (items: any[], arr: string[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items.forEach((subItem: any) => {
        if (subItem.key === item) {
          itemArr.push(subItem);
        }
      });
    });

    return itemArr;
  };

  //get the searched book according to the index
  handleIndexFilter = (items: any, arr: number[]) => {
    let itemArr: any[] = [];
    arr.forEach((item) => {
      items[item] && itemArr.push(items[item]);
    });

    return itemArr;
  };

  // 永久删除选中的书籍
  handlePermanentlyDeleteSelected = async () => {
    if (this.props.selectedBooks.length === 0) {
      toast.error(this.props.t("No books selected"));
      return;
    }

    try {
      for (const bookKey of this.props.selectedBooks) {
        const book = this.props.deletedBooks.find(item => item.key === bookKey);
        if (!book) continue;
        
        const format = book.format.toLowerCase();
        
        await DatabaseService.deleteRecord(bookKey, "books");
        await BookUtil.deleteBook(bookKey, format);
        CoverUtil.deleteCover(bookKey);
        await BookUtil.deleteBook("cache-" + bookKey, "zip");
        
        // 删除各种配置和引用
        ConfigService.deleteListConfig(bookKey, "favoriteBooks");
        ConfigService.deleteListConfig(bookKey, "deletedBooks");
        ConfigService.deleteFromAllMapConfig(bookKey, "shelfList");
        ConfigService.deleteListConfig(bookKey, "recentBooks");
        ConfigService.deleteObjectConfig(bookKey, "recordLocation");
        ConfigService.deleteObjectConfig(bookKey, "readingTime");
        
        // 删除相关的笔记和书签
        await DatabaseService.deleteRecordsByBookKey(bookKey, "bookmarks");
        await DatabaseService.deleteRecordsByBookKey(bookKey, "notes");
      }
      
      this.props.handleSelectedBooks([]);
      this.props.handleSelectBook(false);
      this.setState({ isMultiSelect: false });
      toast.success(this.props.t("Permanently deleted"));
      this.props.handleFetchBooks();
      
      // 仅在方法存在时调用
      if (typeof this.props.handleFetchBookmarks === 'function') {
        this.props.handleFetchBookmarks();
      }
      
      if (typeof this.props.handleFetchNotes === 'function') {
        this.props.handleFetchNotes();
      }
    } catch (error) {
      console.error("Error permanently deleting books:", error);
      toast.error(this.props.t("Delete failed"));
    }
  };

  // 恢复选中的书籍
  handleRestoreSelected = () => {
    if (this.props.selectedBooks.length === 0) {
      toast.error(this.props.t("No books selected"));
      return;
    }

    this.props.selectedBooks.forEach(bookKey => {
      ConfigService.deleteListConfig(bookKey, "deletedBooks");
    });
    
    this.props.handleSelectedBooks([]);
    this.props.handleSelectBook(false);
    this.setState({ isMultiSelect: false });
    toast.success(this.props.t("Restore successful"));
    this.props.handleFetchBooks();
  };

  // 切换多选模式
  toggleMultiSelect = () => {
    this.setState({ isMultiSelect: !this.state.isMultiSelect }, () => {
      if (!this.state.isMultiSelect) {
        this.props.handleSelectedBooks([]);
        this.props.handleSelectBook(false);
      } else {
        this.props.handleSelectBook(true);
      }
    });
  };

  renderBookList = () => {
    //get the book data according to different scenarios
    let books = !this.props.isBookSort
      ? this.handleKeyFilter(
          this.props.deletedBooks,
          ConfigService.getAllListConfig("deletedBooks")
        )
      : this.props.isBookSort
      ? this.handleIndexFilter(
          this.handleKeyFilter(
            this.props.deletedBooks,
            ConfigService.getAllListConfig("deletedBooks")
          ),
          //return the sorted book index
          SortUtil.sortBooks(
            this.props.deletedBooks,
            this.props.bookSortCode,
            ConfigService
          ) || []
        )
      : this.props.isBookSort
      ? this.handleIndexFilter(
          this.props.deletedBooks,
          //return the sorted book index
          SortUtil.sortBooks(
            this.props.deletedBooks,
            this.props.bookSortCode,
            ConfigService
          ) || []
        )
      : this.handleKeyFilter(
          this.props.deletedBooks,
          ConfigService.getAllListConfig("recentBooks")
        );
    if (books.length === 0) {
      return <Redirect to="/manager/empty" />;
    }
    return books.map((item: BookModel, index: number) => {
      return this.props.viewMode === "list" ? (
        <BookListItem
          {...{
            key: index,
            book: item,
          }}
        />
      ) : this.props.viewMode === "card" ? (
        <BookCardItem
          {...{
            key: index,
            book: item,
            isSelected: this.props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      ) : (
        <BookCoverItem
          {...{
            key: index,
            book: item,
            isSelected: this.props.selectedBooks.indexOf(item.key) > -1,
          }}
        />
      );
    });
  };

  render() {
    return (
      <>
        <div
          className="book-list-container-parent"
          style={
            this.props.isCollapsed
              ? { width: "calc(100vw - 70px)", left: "70px" }
              : {}
          }
        >
          <div className="book-list-container">
            <ul className="book-list-item-box">
              {!this.state.isRefreshing && this.renderBookList()}
            </ul>
          </div>
        </div>
        <div
          className="book-list-header"
          style={
            this.props.isCollapsed
              ? { width: "calc(100% - 70px)", left: "70px" }
              : {}
          }
        >
          {this.state.isMultiSelect ? (
            <div className="trash-multi-actions">
              <div
                className="trash-action-btn restore-btn"
                onClick={this.handleRestoreSelected}
              >
                <span className="icon-clockwise"></span>
                <Trans>Restore Selected</Trans>
              </div>
              <div
                className="trash-action-btn delete-btn"
                onClick={this.handlePermanentlyDeleteSelected}
              >
                <span className="icon-trash-line"></span>
                <Trans>Delete Selected</Trans>
              </div>
              <div
                className="trash-action-btn cancel-btn"
                onClick={this.toggleMultiSelect}
              >
                <span className="icon-close"></span>
                <Trans>Cancel</Trans>
              </div>
            </div>
          ) : (
            <>
              <div
                className="trash-multi-select-btn"
                onClick={this.toggleMultiSelect}
              >
                <span className="icon-select"></span>
                <Trans>Select</Trans>
              </div>
              <div
                className="booklist-delete-container"
                onClick={() => {
                  this.props.handleDeleteDialog(true);
                }}
                style={this.props.isCollapsed ? { left: "calc(50% - 60px)" } : {}}
              >
                <Trans>Delete all books</Trans>
              </div>
              <ViewMode />
            </>
          )}
        </div>
      </>
    );
  }
}

export default withRouter(BookList as any);
