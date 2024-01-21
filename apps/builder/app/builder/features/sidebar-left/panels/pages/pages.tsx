import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  DeprecatedIconButton,
  TreeItemLabel,
  TreeItemBody,
  TreeNode,
  type TreeItemRenderProps,
  type ItemSelector,
  styled,
  Flex,
  Tooltip,
  Box,
  Button,
  theme,
} from "@webstudio-is/design-system";
import {
  ChevronRightIcon,
  FolderIcon,
  HomeIcon,
  MenuIcon,
  NewFolderIcon,
  NewPageIcon,
  PageIcon,
} from "@webstudio-is/icons";
import type { TabName } from "../../types";
import { CloseButton, Header } from "../../header";
import { SettingsPanel } from "./settings-panel";
import { NewPageSettings, PageSettings } from "./page-settings";
import { $pages, $selectedPageId } from "~/shared/nano-states";
import { switchPage } from "~/shared/pages";
import {
  getAllChildrenAndSelf,
  reparentOrphansMutable,
  toTreeData,
  type TreeData,
} from "./page-utils";
import {
  FolderSettings,
  NewFolderSettings,
  newFolderId,
} from "./folder-settings";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";
import { serverSyncStore } from "~/shared/sync";
import { useMount } from "~/shared/hook-utils/use-mount";
import type { Folder } from "@webstudio-is/sdk";
import { atom } from "nanostores";

type TabContentProps = {
  onSetActiveTab: (tabName: TabName) => void;
};

const MenuButton = styled(DeprecatedIconButton, {
  color: theme.colors.hint,
  "&:hover, &:focus-visible": { color: theme.colors.hiContrast },
  variants: {
    isParentSelected: {
      true: {
        color: theme.colors.loContrast,
        "&:hover, &:focus-visible": { color: theme.colors.slate7 },
      },
    },
  },
});

const ItemSuffix = ({
  isParentSelected,
  itemId,
  editingItemId,
  onEdit,
  type,
}: {
  isParentSelected: boolean;
  itemId: string;
  editingItemId: string | undefined;
  onEdit: (itemId: string | undefined) => void;
  type: "folder" | "page";
}) => {
  const isEditing = editingItemId === itemId;

  const menuLabel =
    type === "page"
      ? isEditing
        ? "Close page settings"
        : "Open page settings"
      : isEditing
      ? "Close folder settings"
      : "Open folder settings";

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const prevEditingItemId = useRef(editingItemId);
  useEffect(() => {
    // when settings panel close, move focus back to the menu button
    if (
      editingItemId === undefined &&
      prevEditingItemId.current === itemId &&
      buttonRef.current
    ) {
      buttonRef.current.focus();
    }
    prevEditingItemId.current = editingItemId;
  }, [editingItemId, itemId]);

  return (
    <Tooltip content={menuLabel} disableHoverableContent>
      <MenuButton
        aria-label={menuLabel}
        isParentSelected={isParentSelected}
        onClick={() => onEdit(isEditing ? undefined : itemId)}
        ref={buttonRef}
      >
        {isEditing ? <ChevronRightIcon /> : <MenuIcon />}
      </MenuButton>
    </Tooltip>
  );
};

const useReparentOrphans = () => {
  useMount(() => {
    // Pages may not be loaded yet when switching betwen projects and the pages
    // panel was already visible - it mounts faster than we load the pages.
    if ($pages.get() === undefined) {
      return;
    }
    serverSyncStore.createTransaction([$pages], (pages) => {
      if (pages === undefined) {
        return;
      }
      reparentOrphansMutable(pages);
    });
  });
};

const isFolder = (id: string, folders: Array<Folder>) => {
  return id === newFolderId || folders.some((folder) => folder.id === id);
};

// We want to keep the state when panel is closed and opened again.
const $collapsedItems = atom<Set<string>>(new Set());

const PagesPanel = ({
  onClose,
  onCreateNewFolder,
  onCreateNewPage,
  onSelect,
  selectedPageId,
  onEdit,
  editingItemId,
}: {
  onClose: () => void;
  onCreateNewFolder: () => void;
  onCreateNewPage: () => void;
  onSelect: (pageId: string) => void;
  selectedPageId: string;
  onEdit: (pageId: string | undefined) => void;
  editingItemId?: string;
}) => {
  const pages = useStore($pages);
  const treeData = useMemo(() => pages && toTreeData(pages), [pages]);
  const collapsedItems = useStore($collapsedItems);
  useReparentOrphans();
  const renderItem = useCallback(
    (props: TreeItemRenderProps<TreeData>) => {
      if (props.itemData.id === "root") {
        return null;
      }

      const isEditing = editingItemId === props.itemData.id;

      return (
        <TreeItemBody
          {...props}
          suffix={
            <ItemSuffix
              type={props.itemData.type}
              isParentSelected={props.isSelected ?? false}
              itemId={props.itemData.id}
              editingItemId={editingItemId}
              onEdit={onEdit}
            />
          }
          alwaysShowSuffix={isEditing}
          forceFocus={isEditing}
        >
          {props.itemData.type === "folder" && (
            <TreeItemLabel prefix={<FolderIcon />}>
              {props.itemData.name}
            </TreeItemLabel>
          )}
          {props.itemData.type === "page" && (
            <TreeItemLabel
              prefix={
                props.itemData.id === pages?.homePage.id ? (
                  <HomeIcon />
                ) : (
                  <PageIcon />
                )
              }
            >
              {props.itemData.data.name}
            </TreeItemLabel>
          )}
        </TreeItemBody>
      );
    },
    [editingItemId, onEdit]
  );

  const selectTreeNode = useCallback(
    ([itemId]: ItemSelector, all?: boolean) => {
      const folders = pages?.folders ?? [];
      if (isFolder(itemId, folders)) {
        const items = all
          ? getAllChildrenAndSelf(itemId, folders, "folder")
          : [itemId];
        const nextCollapsedItems = new Set(collapsedItems);
        items.forEach((itemId) => {
          collapsedItems.has(itemId)
            ? nextCollapsedItems.delete(itemId)
            : nextCollapsedItems.add(itemId);
        });
        $collapsedItems.set(nextCollapsedItems);
        return;
      }
      onSelect(itemId);
    },
    [onSelect, pages?.folders, collapsedItems]
  );

  if (treeData === undefined || pages === undefined) {
    return null;
  }

  return (
    <Flex
      css={{
        position: "relative",
        height: "100%",
        // z-index needed for page settings animation
        zIndex: 1,
        flexGrow: 1,
        background: theme.colors.backgroundPanel,
      }}
      direction="column"
    >
      <Header
        title="Pages"
        suffix={
          <>
            {isFeatureEnabled("folders") && (
              <Tooltip content="New folder" side="bottom">
                <Button
                  onClick={() => onCreateNewFolder()}
                  aria-label="New folder"
                  prefix={<NewFolderIcon />}
                  color="ghost"
                />
              </Tooltip>
            )}
            <Tooltip content="New page" side="bottom">
              <Button
                onClick={() => onCreateNewPage()}
                aria-label="New page"
                prefix={<NewPageIcon />}
                color="ghost"
              />
            </Tooltip>
            <CloseButton onClick={onClose} />
          </>
        }
      />
      <Box css={{ overflowY: "auto", flexBasis: 0, flexGrow: 1 }}>
        <TreeNode<TreeData>
          selectedItemSelector={[selectedPageId, treeData.root.id]}
          onSelect={selectTreeNode}
          itemData={treeData.root}
          renderItem={renderItem}
          getItemChildren={([nodeId]) => {
            // It's the root folder.
            if (
              nodeId === treeData.root.id &&
              treeData.root.type === "folder"
            ) {
              return treeData.root.children;
            }
            const item = treeData.index.get(nodeId);
            if (item?.type === "folder") {
              return item.children;
            }
            // Page can't have children.
            return [];
          }}
          isItemHidden={([itemId]) => itemId === treeData.root.id}
          getIsExpanded={([itemId]) => {
            return collapsedItems.has(itemId) === false;
          }}
          setIsExpanded={([itemId], value, all) => {
            const nextCollapsedItems = new Set(collapsedItems);
            if (itemId === undefined) {
              return;
            }
            const items = all
              ? getAllChildrenAndSelf(itemId, pages.folders, "folder")
              : [itemId];
            items.forEach((itemId) => {
              value
                ? nextCollapsedItems.delete(itemId)
                : nextCollapsedItems.add(itemId);
            });
            $collapsedItems.set(nextCollapsedItems);
          }}
        />
      </Box>
    </Flex>
  );
};

const newPageId = "new-page";

const PageEditor = ({
  editingPageId,
  setEditingPageId,
}: {
  editingPageId: string;
  setEditingPageId: (pageId?: string) => void;
}) => {
  const currentPageId = useStore($selectedPageId);

  if (editingPageId === newPageId) {
    return (
      <NewPageSettings
        onClose={() => setEditingPageId(undefined)}
        onSuccess={(pageId) => {
          setEditingPageId(undefined);
          switchPage(pageId);
        }}
      />
    );
  }

  return (
    <PageSettings
      onClose={() => setEditingPageId(undefined)}
      onDelete={() => {
        setEditingPageId(undefined);
        if (editingPageId === currentPageId) {
          switchPage(currentPageId);
        }
      }}
      onDuplicate={(newPageId) => {
        setEditingPageId(undefined);
        switchPage(newPageId);
      }}
      pageId={editingPageId}
      key={editingPageId}
    />
  );
};

const FolderEditor = ({
  editingFolderId,
  setEditingFolderId,
}: {
  editingFolderId: string;
  setEditingFolderId: (pageId?: string) => void;
}) => {
  if (editingFolderId === newFolderId) {
    return (
      <NewFolderSettings
        onClose={() => setEditingFolderId(undefined)}
        onSuccess={() => {
          setEditingFolderId(undefined);
        }}
        key={newFolderId}
      />
    );
  }

  return (
    <FolderSettings
      onClose={() => setEditingFolderId(undefined)}
      onDelete={() => {
        setEditingFolderId(undefined);
      }}
      folderId={editingFolderId}
      key={editingFolderId}
    />
  );
};

export const TabContent = ({ onSetActiveTab }: TabContentProps) => {
  const currentPageId = useStore($selectedPageId);
  const [editingItemId, setEditingItemId] = useState<string>();
  const pages = useStore($pages);

  if (currentPageId === undefined || pages === undefined) {
    return null;
  }

  return (
    <>
      <PagesPanel
        onClose={() => onSetActiveTab("none")}
        onCreateNewFolder={() => {
          setEditingItemId(
            editingItemId === newFolderId ? undefined : newFolderId
          );
        }}
        onCreateNewPage={() =>
          setEditingItemId(editingItemId === newPageId ? undefined : newPageId)
        }
        onSelect={(itemId) => {
          if (isFolder(itemId, pages.folders)) {
            return;
          }
          switchPage(itemId);
          onSetActiveTab("none");
        }}
        selectedPageId={currentPageId}
        onEdit={setEditingItemId}
        editingItemId={editingItemId}
      />

      {editingItemId && (
        <SettingsPanel isOpen>
          {isFolder(editingItemId, pages.folders) ? (
            <FolderEditor
              editingFolderId={editingItemId}
              setEditingFolderId={setEditingItemId}
            />
          ) : (
            <PageEditor
              editingPageId={editingItemId}
              setEditingPageId={setEditingItemId}
            />
          )}
        </SettingsPanel>
      )}
    </>
  );
};

export const icon = <PageIcon />;
