import propTypeToFlowType from './propTypeToFlowType';

export default function transformProperties(j, properties) {
  return properties.map(property =>
    propTypeToFlowType(j, property.key, property.value, property.leadingComments, property.comments)
  );
}
