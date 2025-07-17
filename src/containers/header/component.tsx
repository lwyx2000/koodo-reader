import React from "react";
import "./header.css";
import SearchBox from "../../components/searchBox";
import ImportLocal from "../../components/importLocal";
import { HeaderProps, HeaderState } from "./interface";
import {
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import UpdateInfo from "../../components/dialogs/updateDialog";
import { restoreFromConfigJson } from "../../utils/file/restore";
import { backupToConfigJson } from "../../utils/file/backup";
import { isElectron } from "react-device-detect";
import {
  upgradeConfig,
  upgradeStorage,
} from "../../utils/file/common";
import toast from "react-hot-toast";
import { Trans } from "react-i18next";

import ConfigUtil from "../../utils/file/configUtil";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import BookUtil from "../../utils/file/bookUtil";
import {
  addChatBox,
  getChatLocale,
  getStorageLocation,
  removeChatBox,
} from "../../utils/common";




class Header extends React.Component<HeaderProps, HeaderState> {
  timer: any;
  constructor(props: HeaderProps) {
    super(props);

    this.state = {
      isOnlyLocal: false,
      language: ConfigService.getReaderConfig("lang"),
      isNewVersion: false,
      width: document.body.clientWidth,
      isDataChange: false,
      isDeveloperVer: false,
      isHidePro: false,
    };
  }
  async componentDidMount() {
    this.props.handleFetchAuthed();

    if (isElectron) {
      const fs = window.require("fs");
      const path = window.require("path");
      const { ipcRenderer } = window.require("electron");
      const dirPath = ipcRenderer.sendSync("user-data", "ping");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(path.join(dirPath, "data", "book"), { recursive: true });
        console.info("folder created");
      } else {
        console.info("folder exist");
      }

      if (
        ConfigService.getReaderConfig("storageLocation") &&
        !ConfigService.getItem("storageLocation")
      ) {
        ConfigService.setItem(
          "storageLocation",
          ConfigService.getReaderConfig("storageLocation")
        );
      }

      if (ConfigService.getReaderConfig("appInfo") === "dev") {
        this.setState({ isDeveloperVer: true });
      }
      if (ConfigService.getReaderConfig("isHidePro") === "yes") {
        this.setState({ isHidePro: true });
      }

      //Check for data update
      //upgrade data from old version
      let res1 = await upgradeStorage(this.handleFinishUpgrade);
      let res2 = upgradeConfig();
      if (!res1 || !res2) {
        console.error("upgrade failed");
      }
    } else {
      upgradeConfig();
    }
    window.addEventListener("resize", () => {
      this.setState({ width: document.body.clientWidth });
    });
    window.addEventListener("focus", () => {
      this.props.handleFetchBooks();
      this.props.handleFetchNotes();
      this.props.handleFetchBookmarks();
    });
  }
  async UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<HeaderProps>,
    _nextContext: any
  ) {
    if (nextProps.isAuthed && nextProps.isAuthed !== this.props.isAuthed) {
      if (isElectron) {
        window.require("electron").ipcRenderer.invoke("new-chat", {
          url: "https://dl.koodoreader.com/chat.html",
          locale: getChatLocale(),
        });
      } else {
        addChatBox();
      }

    }
    if (!nextProps.isAuthed && nextProps.isAuthed !== this.props.isAuthed) {
      if (isElectron) {
        window.require("electron").ipcRenderer.invoke("exit-chat", {
          url: "https://dl.koodoreader.com/chat.html",
          locale: getChatLocale(),
        });
      } else {
        removeChatBox();
      }
    }
  }
  handleFinishUpgrade = () => {
    setTimeout(() => {
      this.props.history.push("/manager/home");
    }, 1000);
  };











  render() {
    return (
      <div
        className="header"
        style={this.props.isCollapsed ? { marginLeft: "40px" } : {}}
      >
        <div
          className="header-search-container"
          style={this.props.isCollapsed ? { width: "369px" } : {}}
        >
          <SearchBox />
        </div>
        <div
          className="setting-icon-parrent"
          style={this.props.isCollapsed ? { marginLeft: "430px" } : {}}
        >
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleSortDisplay(!this.props.isSortDisplay);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ top: "18px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Sort by")}
              data-tooltip-place="left"
            >
              <span className="icon-sort-desc header-sort-icon"></span>
            </span>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleAbout(!this.props.isAboutOpen);
            }}
            onMouseLeave={() => {
              this.props.handleAbout(false);
            }}
            style={{ marginTop: "2px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Setting")}
              data-tooltip-place="left"
            >
              <span
                className="icon-setting setting-icon"
                style={
                  this.props.isNewWarning ? { color: "rgb(35, 170, 242)" } : {}
                }
              ></span>
            </span>
          </div>
          <div
            className="setting-icon-container"
            onClick={() => {
              this.props.handleBackupDialog(true);
            }}
            onMouseLeave={() => {
              this.props.handleSortDisplay(false);
            }}
            style={{ marginTop: "1px" }}
          >
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={this.props.t("Backup")}
              data-tooltip-place="left"
            >
              <span className="icon-archive header-archive-icon"></span>
            </span>
          </div>


        </div>


        {this.state.isDeveloperVer &&
          this.state.isHidePro &&
          !this.props.isAuthed && (
            <div
              className="header-report-container"
              style={{ textDecoration: "underline" }}
              onClick={() => {
                this.props.handleFeedbackDialog(true);
              }}
            >
              <Trans>Report</Trans>
            </div>
          )}

        <ImportLocal
          {...{
            handleDrag: this.props.handleDrag,
          }}
        />
        <UpdateInfo />

      </div>
    );
  }
}

export default Header;
