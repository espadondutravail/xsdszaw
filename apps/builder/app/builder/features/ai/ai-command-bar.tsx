import { useStore } from "@nanostores/react";
import {
  AutogrowTextArea,
  Box,
  Button,
  CommandBar,
  CommandBarButton,
  CommandBarContentPrompt,
  CommandBarContentSection,
  CommandBarContentSeparator,
  CommandBarTrigger,
  Flex,
  Grid,
  ScrollArea,
  Text,
  Tooltip,
  theme,
  useDisableCanvasPointerEvents,
} from "@webstudio-is/design-system";
import {
  AiIcon,
  MicIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  StopIcon,
  LargeXIcon,
} from "@webstudio-is/icons";
import {
  useRef,
  useState,
  type MouseEvent,
  type ComponentPropsWithoutRef,
} from "react";
import { $isAiCommandBarVisible } from "~/shared/nano-states";
import { useMediaRecorder } from "./hooks/media-recorder";
import { useLongPressToggle } from "./hooks/long-press-toggle";
import { restAi } from "~/shared/router-utils";

const fetchTranscription = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${restAi()}/audio/transcriptions`, {
    method: "POST",
    body: formData,
  });

  if (response.ok === false) {
    // @todo: show error
    return;
  }

  // @todo add response parsing
  const { text } = await response.json();

  return text;
};

type PartialButtonProps<T = ComponentPropsWithoutRef<typeof Button>> = {
  [key in keyof T]?: T[key];
};

export const AiCommandBar = () => {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [isAudioTranscribing, setIsAudioTranscribing] = useState(false);
  const isAiCommandBarVisible = useStore($isAiCommandBarVisible);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const uploadIdRef = useRef(0);
  const { enableCanvasPointerEvents, disableCanvasPointerEvents } =
    useDisableCanvasPointerEvents();

  const {
    start,
    stop,
    cancel,
    state: mediaRecorderState,
  } = useMediaRecorder({
    onComplete: async (file) => {
      setIsAudioTranscribing(true);
      uploadIdRef.current++;
      const uploadId = uploadIdRef.current;
      const text = await fetchTranscription(file);
      if (uploadId !== uploadIdRef.current) {
        return;
      }
      setValue((previousText) => `${previousText} ${text}`);
      setIsAudioTranscribing(false);
    },
    onReportSoundAmplitude: (amplitude) => {
      recordButtonRef.current?.style.setProperty(
        "--amplitude",
        amplitude.toString()
      );
    },
  });

  const longPressToggleProps = useLongPressToggle({
    onStart: () => {
      start();
      disableCanvasPointerEvents();
    },
    onEnd: () => {
      stop();
      enableCanvasPointerEvents();
    },
    onCancel: () => {
      cancel();
      enableCanvasPointerEvents();
    },
  });

  if (isAiCommandBarVisible === false) {
    return;
  }

  let textAreaPlaceholder = "Enter value...";
  let textAreaValue = value;
  let textAreaDisabled = false;
  let aiButtonDisabled = false;

  let recordButtonTooltipContent = "Start recording";
  let recordButtonColor: ComponentPropsWithoutRef<typeof Button>["color"] =
    "dark-ghost";
  let recordButtonProps: PartialButtonProps = longPressToggleProps;
  let recordButtonIcon = <MicIcon />;

  if (isAudioTranscribing) {
    textAreaPlaceholder = "Transcribing voice...";
    // Show placeholder instead
    textAreaValue = "";
    textAreaDisabled = true;
    aiButtonDisabled = true;

    recordButtonTooltipContent = "Cancel";
    recordButtonColor = "neutral";
    recordButtonProps = {
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        // Cancel transcription
        uploadIdRef.current++;
        setIsAudioTranscribing(false);
      },
    };
    recordButtonIcon = <LargeXIcon />;
  }

  if (mediaRecorderState === "recording") {
    textAreaPlaceholder = "Recording voice...";
    // Show placeholder instead
    textAreaValue = "";
    textAreaDisabled = true;
    aiButtonDisabled = true;

    recordButtonTooltipContent = "Stop recording";
    recordButtonColor = "destructive";
    recordButtonIcon = <StopIcon />;
  }

  return (
    <Box
      css={{
        position: "absolute",
        bottom: theme.spacing[11],
        left: 0,
        right: 0,
        height: 0,
        justifyContent: "center",
        alignItems: "flex-end",
        display: "flex",
      }}
    >
      <CommandBar
        open={open}
        onOpenChange={setOpen}
        content={<CommandBarContent />}
      >
        <CommandBarTrigger>
          <CommandBarButton color="dark-ghost">
            <ChevronUpIcon />
          </CommandBarButton>
        </CommandBarTrigger>

        <Grid
          css={{
            alignSelf: "center",
            // color: theme.colors.foregroundContrastMain,
            // Set maxWidth to autogrow in width
            width: theme.spacing[31],
          }}
        >
          <ScrollArea css={{ maxHeight: theme.spacing[29] }}>
            <AutogrowTextArea
              autoFocus
              disabled={textAreaDisabled}
              placeholder={textAreaPlaceholder}
              value={textAreaValue}
              onChange={setValue}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.shiftKey === false) {
                  event.preventDefault();
                  // @todo add text submit here
                }
              }}
            />
          </ScrollArea>
        </Grid>

        <Tooltip
          side="top"
          sideOffset={10}
          delayDuration={100}
          content={recordButtonTooltipContent}
        >
          <CommandBarButton
            ref={recordButtonRef}
            css={{
              opacity: "calc(1 - 0.5 * var(--amplitude, 0))",
              transition: "opacity 0.1s ease-in-out",
            }}
            color={recordButtonColor}
            {...recordButtonProps}
          >
            {recordButtonIcon}
          </CommandBarButton>
        </Tooltip>

        <Tooltip
          side="top"
          sideOffset={10}
          delayDuration={0}
          content="Generate AI results"
        >
          <CommandBarButton color="gradient" disabled={aiButtonDisabled}>
            <AiIcon />
          </CommandBarButton>
        </Tooltip>
      </CommandBar>
    </Box>
  );
};

const CommandBarContent = () => {
  return (
    <>
      <CommandBarContentSection>
        <Text variant={"labelsSentenceCase"} align={"center"}>
          Welcome to Webstudio AI alpha!
        </Text>
        <div />
        <Text variant={"labelsSentenceCase"}>
          Ask me to generate or edit sections, text, or images.
          <br /> For example you can say: ”Make a new contact section”
        </Text>
        <Flex align={"end"}>
          <Button
            color="dark"
            css={{
              width: theme.spacing[30],
            }}
            suffix={<ExternalLinkIcon />}
          >
            Learn more
          </Button>
          <Text
            variant={"labelsSentenceCase"}
            color={"subtle"}
            css={{ flex: 1 }}
            align={"center"}
          >
            shortcut ⌘⇧Q
          </Text>
        </Flex>
      </CommandBarContentSection>

      <CommandBarContentSeparator />

      <CommandBarContentSection>
        <Text variant={"labelsSentenceCase"} align={"center"}>
          Previous prompts
        </Text>
        <div />
        <CommandBarContentPrompt>
          Make a new section with a contact form
        </CommandBarContentPrompt>
        <CommandBarContentPrompt>
          Add an image of a cat smiling wearing eyeglasses
        </CommandBarContentPrompt>
        <CommandBarContentPrompt>
          Write a breakup letter for my girlfriend and make it long enough to
          break into multiple lines
        </CommandBarContentPrompt>
        <CommandBarContentPrompt>
          Make all headings bold
        </CommandBarContentPrompt>
      </CommandBarContentSection>
    </>
  );
};
