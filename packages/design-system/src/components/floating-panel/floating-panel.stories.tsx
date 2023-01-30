import { Button } from "../button";
import { StorySection } from "../storybook";
import * as Dialog from "./floating-panel-dialog";
import { css, theme } from "../../stitches.config";
import { typography } from "../typography";

export default {
  title: "Library/Floating Panel",
};

const bodyStyles = css({
  padding: theme.spacing[9],
});

const descriptionStyles = css(typography.regular, {
  marginTop: 0,
  marginBottom: theme.spacing[5],
});

const buttonsStyle = css({
  display: "flex",
  gap: theme.spacing[5],
  justifyContent: "flex-end",
});

const DialogDemo = () => (
  <Dialog.Root>
    <Dialog.Trigger asChild>
      <Button>Open</Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <div className={bodyStyles()}>
        <Dialog.Description asChild>
          <p className={descriptionStyles()}>This is a description</p>
        </Dialog.Description>
        <div className={buttonsStyle()}>
          <Dialog.Close asChild>
            <Button color="ghost">Cancel</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button color="positive">Save</Button>
          </Dialog.Close>
        </div>
      </div>

      {/* Title is at the end intentionally,
       * to make the close button last in the tab order
       */}
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Content>
  </Dialog.Root>
);

export const FloatingPanel = () => (
  <>
    <StorySection title="Dialog">
      <DialogDemo />
    </StorySection>
  </>
);
