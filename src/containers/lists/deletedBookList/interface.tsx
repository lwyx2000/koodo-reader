import BookModel from "../../../models/Book";
import { RouteComponentProps } from "react-router";
export interface BookListProps extends RouteComponentProps<any> {
  books: BookModel[];
  deletedBooks: BookModel[];
  mode: string;
  selectedBooks: string[];
  isBookSort: boolean;
  isCollapsed: boolean;
  isSelectBook: boolean;

  viewMode: string;
  bookSortCode: { sort: number; order: number };
  noteSortCode: { sort: number; order: number };
  handleFetchList: () => void;
  handleMode: (mode: string) => void;
  handleDeleteDialog: (isShow: boolean) => void;
  handleFetchBooks: () => void;
  handleFetchBookmarks: () => void;
  handleFetchNotes: () => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  t: (title: string) => string;
}

export interface BookListState {
  isRefreshing: boolean;
  isMultiSelect: boolean;
}
