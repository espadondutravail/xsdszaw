import { z } from "zod";
import { type FocusEventHandler, useState, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useDebouncedCallback } from "use-debounce";
import { useUnmount } from "react-use";
import slugify from "slugify";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";
import {
  type Page,
  type Pages,
  PageName,
  HomePagePath,
  PageTitle,
  PagePath,
  DataSource,
} from "@webstudio-is/sdk";
import { findPageByIdOrPath } from "@webstudio-is/project-build";
import {
  theme,
  Button,
  Box,
  Label,
  InputErrorsTooltip,
  Tooltip,
  InputField,
  Grid,
  ScrollArea,
  rawTheme,
  Flex,
} from "@webstudio-is/design-system";
import {
  ChevronDoubleLeftIcon,
  TrashIcon,
  HelpIcon,
} from "@webstudio-is/icons";
import { useIds } from "~/shared/form-utils";
import { Header, HeaderSuffixSpacer } from "../../header";
import { deleteInstance } from "~/shared/instance-utils";
import {
  instancesStore,
  pagesStore,
  selectedInstanceSelectorStore,
  selectedPageIdStore,
  $dataSources,
} from "~/shared/nano-states";
import { nanoid } from "nanoid";
import { removeByMutable } from "~/shared/array-utils";
import { serverSyncStore } from "~/shared/sync";
import { useEffectEvent } from "~/builder/features/ai/hooks/effect-event";
import { parsePathnamePattern, validatePathnamePattern } from "./url-pattern";

const fieldDefaultValues = {
  name: "Untitled",
  path: "/untitled",
  title: "Untitled",
  description: "",
  isHomePage: false,
  excludePageFromSearch: false,
  socialImageAssetId: "",
  customMetas: [
    {
      property: "",
      content: "",
    },
  ],
};

const fieldNames = Object.keys(
  fieldDefaultValues
) as (keyof typeof fieldDefaultValues)[];

type FieldName = (typeof fieldNames)[number];

type Values = typeof fieldDefaultValues;

type Errors = {
  [fieldName in FieldName]?: string[];
};

const LegacyPagePath = z
  .string()
  .refine((path) => path !== "", "Can't be empty")
  .refine((path) => path !== "/", "Can't be just a /")
  .refine((path) => path === "" || path.startsWith("/"), "Must start with a /")
  .refine((path) => path.endsWith("/") === false, "Can't end with a /")
  .refine((path) => path.includes("//") === false, "Can't contain repeating /")
  .refine(
    (path) => /^[-_a-z0-9\\/]*$/.test(path),
    "Only a-z, 0-9, -, _, / are allowed"
  )
  .refine(
    // We use /s for our system stuff like /s/css or /s/uploads
    (path) => path !== "/s" && path.startsWith("/s/") === false,
    "/s prefix is reserved for the system"
  )
  .refine(
    // Remix serves build artefacts like JS bundles from /build
    // And we cannot customize it due to bug in Remix: https://github.com/remix-run/remix/issues/2933
    (path) => path !== "/build" && path.startsWith("/build/") === false,
    "/build prefix is reserved for the system"
  );

const HomePageValues = z.object({
  name: PageName,
  path: HomePagePath,
  title: PageTitle,
  description: z.string().optional(),
});

const PageValues = z.object({
  name: PageName,
  path: isFeatureEnabled("bindings") ? PagePath : LegacyPagePath,
  title: PageTitle,
  description: z.string().optional(),
});

const isPathUnique = (
  pages: Pages,
  // undefined page id means new page
  pageId: undefined | Page["id"],
  path: string
) => {
  const list = [];
  const set = new Set();
  list.push(path);
  set.add(path);
  for (const page of pages.pages) {
    if (page.id !== pageId) {
      list.push(page.path);
      set.add(page.path);
    }
  }
  return list.length === set.size;
};

const validateValues = (
  pages: undefined | Pages,
  // undefined page id means new page
  pageId: undefined | Page["id"],
  values: Values,
  isHomePage: boolean
): Errors => {
  const Validator = isHomePage ? HomePageValues : PageValues;
  const parsedResult = Validator.safeParse(values);
  const errors: Errors = {};
  if (parsedResult.success === false) {
    return parsedResult.error.formErrors.fieldErrors;
  }
  if (pages !== undefined && values.path !== undefined) {
    if (isPathUnique(pages, pageId, values.path) === false) {
      errors.path = errors.path ?? [];
      errors.path.push("All paths must be unique");
    }
    const messages = validatePathnamePattern(values.path);
    if (messages.length > 0) {
      errors.path = errors.path ?? [];
      errors.path.push(...messages);
    }
  }
  return errors;
};

const toFormPage = (page: Page, isHomePage: boolean): Values => {
  return {
    name: page.name,
    path: page.path,
    title: page.title,
    description: page.meta.description ?? fieldDefaultValues.description,
    socialImageAssetId:
      page.meta.socialImageAssetId ?? fieldDefaultValues.socialImageAssetId,
    excludePageFromSearch:
      page.meta.excludePageFromSearch ??
      fieldDefaultValues.excludePageFromSearch,
    isHomePage,
    customMetas: page.meta.custom ?? fieldDefaultValues.customMetas,
  };
};

const autoSelectHandler: FocusEventHandler<HTMLInputElement> = (event) =>
  event.target.select();

const FormFields = ({
  disabled,
  autoSelect,
  errors,
  values,
  onChange,
}: {
  disabled?: boolean;
  autoSelect?: boolean;
  pathVariableId?: DataSource["id"];
  errors: Errors;
  values: Values;
  onChange: (
    event: {
      [K in keyof Values]: {
        field: K;
        value: Values[K];
      };
    }[keyof Values]
  ) => void;
}) => {
  const fieldIds = useIds(fieldNames);

  const TOPBAR_HEIGHT = 40;
  const HEADER_HEIGHT = 40;
  const FOOTER_HEIGHT = 24;
  const SCROLL_AREA_DELTA = TOPBAR_HEIGHT + HEADER_HEIGHT + FOOTER_HEIGHT;

  return (
    <Grid>
      <ScrollArea css={{ maxHeight: `calc(100vh - ${SCROLL_AREA_DELTA}px)` }}>
        {/**
         * ----------------------========<<<Page props>>>>========----------------------
         */}
        <Grid gap={3} css={{ my: theme.spacing[5], mx: theme.spacing[8] }}>
          <Grid gap={1}>
            <Label htmlFor={fieldIds.name}>Folder Name</Label>
            <InputErrorsTooltip errors={errors.name}>
              <InputField
                tabIndex={1}
                color={errors.name && "error"}
                id={fieldIds.name}
                autoFocus
                onFocus={autoSelect ? autoSelectHandler : undefined}
                name="name"
                placeholder="About"
                disabled={disabled}
                value={values.name}
                onChange={(event) => {
                  onChange({ field: "name", value: event.target.value });
                }}
              />
            </InputErrorsTooltip>
          </Grid>

          <Grid gap={1}>
            <Label htmlFor={fieldIds.path}>
              <Flex align="center" css={{ gap: theme.spacing[3] }}>
                Path
                <Tooltip
                  content={
                    "The path can include dynamic parameters like :name, which could be made optional using :name?, or have a wildcard such as /* or /:name* to store whole remaining part at the end of the URL."
                  }
                  variant="wrapped"
                >
                  <HelpIcon
                    color={rawTheme.colors.foregroundSubtle}
                    tabIndex={0}
                  />
                </Tooltip>
              </Flex>
            </Label>
            <InputErrorsTooltip errors={errors.path}>
              <InputField
                tabIndex={1}
                color={errors.path && "error"}
                id={fieldIds.path}
                name="path"
                placeholder="/about"
                disabled={disabled}
                value={values?.path}
                onChange={(event) => {
                  onChange({ field: "path", value: event.target.value });
                }}
              />
            </InputErrorsTooltip>
          </Grid>
        </Grid>
      </ScrollArea>
    </Grid>
  );
};

const nameToPath = (pages: Pages | undefined, name: string) => {
  if (name === "") {
    return "";
  }

  const slug = slugify(name, { lower: true, strict: true });
  const path = `/${slug}`;

  // for TypeScript
  if (pages === undefined) {
    return path;
  }

  if (findPageByIdOrPath(pages, path) === undefined) {
    return path;
  }

  let suffix = 1;

  while (findPageByIdOrPath(pages, `${path}${suffix}`) !== undefined) {
    suffix++;
  }

  return `${path}${suffix}`;
};

export const NewFolderSettings = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (pageId: Page["id"]) => void;
}) => {
  const pages = useStore(pagesStore);

  const [values, setValues] = useState<Values>({
    ...fieldDefaultValues,
    path: nameToPath(pages, fieldDefaultValues.name),
  });
  const errors = validateValues(pages, undefined, values, false);

  const handleSubmit = () => {
    if (Object.keys(errors).length === 0) {
      const pageId = nanoid();

      serverSyncStore.createTransaction(
        [pagesStore, instancesStore],
        (pages, instances) => {
          if (pages === undefined) {
            return;
          }
          const rootInstanceId = nanoid();
          pages.pages.push({
            id: pageId,
            name: values.name,
            path: values.path,
            title: values.title,
            rootInstanceId,
            meta: {},
          });

          instances.set(rootInstanceId, {
            type: "instance",
            id: rootInstanceId,
            component: "Body",
            children: [],
          });
          selectedInstanceSelectorStore.set(undefined);
        }
      );

      updateFolder(pageId, values);

      onSuccess(pageId);
    }
  };

  return (
    <NewFolderSettingsView
      onSubmit={handleSubmit}
      onClose={onClose}
      isSubmitting={false}
    >
      <FormFields
        autoSelect
        errors={errors}
        disabled={false}
        values={values}
        onChange={(val) => {
          setValues((values) => {
            const changes = { [val.field]: val.value };

            if (val.field === "name") {
              if (values.path === nameToPath(pages, values.name)) {
                changes.path = nameToPath(pages, val.value);
              }
              if (values.title === values.name) {
                changes.title = val.value;
              }
            }
            return { ...values, ...changes };
          });
        }}
      />
    </NewFolderSettingsView>
  );
};

const NewFolderSettingsView = ({
  onSubmit,
  isSubmitting,
  onClose,
  children,
}: {
  onSubmit: () => void;
  isSubmitting: boolean;
  onClose: () => void;
  children: JSX.Element;
}) => {
  return (
    <>
      <Header
        title="New Folder Settings"
        suffix={
          <>
            <Tooltip content="Cancel" side="bottom">
              <Button
                onClick={onClose}
                aria-label="Cancel"
                prefix={<ChevronDoubleLeftIcon />}
                color="ghost"
                // Tab should go:
                //   trought form fields -> create button -> cancel button
                tabIndex={3}
              />
            </Tooltip>
            <HeaderSuffixSpacer />
            <Button
              state={isSubmitting ? "pending" : "auto"}
              onClick={onSubmit}
              tabIndex={2}
            >
              {isSubmitting ? "Creating" : "Create folder"}
            </Button>
          </>
        }
      />
      <Box css={{ overflow: "auto" }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <input type="submit" hidden />
        </form>
      </Box>
    </>
  );
};

const updateFolder = (pageId: Page["id"], values: Partial<Values>) => {
  const updateFolderMutable = (page: Page, values: Partial<Values>) => {
    if (values.name !== undefined) {
      page.name = values.name;
    }
    if (values.path !== undefined) {
      page.path = values.path;
    }
    if (values.title !== undefined) {
      page.title = values.title;
    }

    if (values.description !== undefined) {
      page.meta.description = values.description;
    }

    if (values.excludePageFromSearch !== undefined) {
      page.meta.excludePageFromSearch = values.excludePageFromSearch;
    }

    if (values.socialImageAssetId !== undefined) {
      page.meta.socialImageAssetId = values.socialImageAssetId;
    }

    if (values.customMetas !== undefined) {
      page.meta.custom = values.customMetas;
    }
  };

  serverSyncStore.createTransaction(
    [pagesStore, $dataSources],
    (pages, dataSources) => {
      if (pages === undefined) {
        return;
      }

      // swap home page
      if (values.isHomePage && pages.homePage.id !== pageId) {
        const newHomePageIndex = pages.pages.findIndex(
          (page) => page.id === pageId
        );

        if (newHomePageIndex === -1) {
          throw new Error(`Page with id ${pageId} not found`);
        }

        const tmp = pages.homePage;
        pages.homePage = pages.pages[newHomePageIndex];

        pages.homePage.path = "";
        pages.pages[newHomePageIndex] = tmp;

        tmp.path = nameToPath(pages, tmp.name);
      }

      if (pages.homePage.id === pageId) {
        updateFolderMutable(pages.homePage, values);
      }

      for (const page of pages.pages) {
        if (page.id === pageId) {
          // create "Page params" variable when pattern is specified in path
          const paramNames = parsePathnamePattern(page.path);
          if (paramNames.length > 0 && page.pathVariableId === undefined) {
            page.pathVariableId = nanoid();
            dataSources.set(page.pathVariableId, {
              id: page.pathVariableId,
              // scope new variable to body
              scopeInstanceId: page.rootInstanceId,
              type: "parameter",
              name: "Page params",
            });
          }
          updateFolderMutable(page, values);
        }
      }
    }
  );
};

const deleteFolder = (pageId: Page["id"]) => {
  const pages = pagesStore.get();
  // deselect page before deleting to avoid flash of content
  if (selectedPageIdStore.get() === pageId) {
    selectedPageIdStore.set(pages?.homePage.id);
    selectedInstanceSelectorStore.set(undefined);
  }
  const rootInstanceId = pages?.pages.find(
    (page) => page.id === pageId
  )?.rootInstanceId;
  if (rootInstanceId !== undefined) {
    deleteInstance([rootInstanceId]);
  }
  serverSyncStore.createTransaction([pagesStore], (pages) => {
    if (pages === undefined) {
      return;
    }
    removeByMutable(pages.pages, (page) => page.id === pageId);
  });
};

export const FolderSettings = ({
  onClose,
  onDelete,
  pageId,
}: {
  onClose: () => void;
  onDelete: () => void;
  pageId: string;
}) => {
  const pages = useStore(pagesStore);
  const page = pages && findPageByIdOrPath(pages, pageId);

  const isHomePage = page?.id === pages?.homePage.id;

  const [unsavedValues, setUnsavedValues] = useState<Partial<Values>>({});

  const values: Values = {
    ...(page ? toFormPage(page, isHomePage) : fieldDefaultValues),
    ...unsavedValues,
  };

  const errors = validateValues(pages, pageId, values, values.isHomePage);

  const debouncedFn = useEffectEvent(() => {
    if (
      Object.keys(unsavedValues).length === 0 ||
      Object.keys(errors).length !== 0
    ) {
      return;
    }

    updateFolder(pageId, unsavedValues);

    setUnsavedValues({});
  });

  const handleSubmitDebounced = useDebouncedCallback(debouncedFn, 1000);

  const handleChange = useCallback(
    <Name extends FieldName>(event: { field: Name; value: Values[Name] }) => {
      setUnsavedValues((values) => ({
        ...values,
        [event.field]: event.value,
      }));
      handleSubmitDebounced();
    },
    [handleSubmitDebounced]
  );

  useUnmount(() => {
    if (
      Object.keys(unsavedValues).length === 0 ||
      Object.keys(errors).length !== 0
    ) {
      return;
    }
    updateFolder(pageId, unsavedValues);
  });

  const hanldeDelete = () => {
    deleteFolder(pageId);
    onDelete();
  };

  if (page === undefined) {
    return null;
  }

  return (
    <FolderSettingsView onClose={onClose} onDelete={hanldeDelete}>
      <FormFields
        pathVariableId={page.pathVariableId}
        errors={errors}
        values={values}
        onChange={handleChange}
      />
    </FolderSettingsView>
  );
};

const FolderSettingsView = ({
  onDelete,
  onClose,
  children,
}: {
  onDelete: () => void;
  onClose: () => void;
  children: JSX.Element;
}) => {
  return (
    <>
      <Header
        title="Folder Settings"
        suffix={
          <>
            <Tooltip content="Delete folder" side="bottom">
              <Button
                color="ghost"
                prefix={<TrashIcon />}
                onClick={onDelete}
                aria-label="Delete folder"
                tabIndex={2}
              />
            </Tooltip>
            <Tooltip content="Close folder settings" side="bottom">
              <Button
                color="ghost"
                prefix={<ChevronDoubleLeftIcon />}
                onClick={onClose}
                aria-label="Close folder settings"
                tabIndex={2}
              />
            </Tooltip>
          </>
        }
      />
      <Box css={{ overflow: "auto" }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onClose?.();
          }}
        >
          {children}
          <input type="submit" hidden />
        </form>
      </Box>
    </>
  );
};
