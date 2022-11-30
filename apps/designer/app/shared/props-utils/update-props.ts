import {
  type AllUserProps,
  type UserPropsUpdates,
} from "@webstudio-is/react-sdk";

export const updateAllUserPropsMutable = (
  allUserProps: AllUserProps,
  { instanceId, propsId, treeId, updates }: UserPropsUpdates
) => {
  if (instanceId in allUserProps === false) {
    allUserProps[instanceId] = {
      id: propsId,
      instanceId,
      treeId,
      props: [],
    };
  }
  const instanceProps = allUserProps[instanceId];
  for (const update of updates) {
    const propIndex = instanceProps.props.findIndex(
      ({ id }) => id === update.id
    );

    if (propIndex === -1) {
      instanceProps.props.push(update);
    } else {
      const prop = instanceProps.props[propIndex];

      prop.prop = update.prop;

      if ("value" in update) {
        instanceProps.props[propIndex] = {
          id: prop.id,
          prop: update.prop,
          value: update.value,
          required: update.required,
        };
      } else {
        instanceProps.props[propIndex] = {
          id: prop.id,
          prop: update.prop,
          asset: update.asset,
          required: update.required,
        };
      }

      // Prop changed type from value to asset or vice versa
      instanceProps.props[propIndex] = update;
    }
  }
};
