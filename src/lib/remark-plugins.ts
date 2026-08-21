import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent } from "mdast";

const SUB_REGEX = /~([^~\n]+)~/g;
const SUP_REGEX = /\^([^\^\n]+)\^/g;

export const remarkSubSup: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node: Text) => {
    const hasSub = SUB_REGEX.test(node.value);
    SUB_REGEX.lastIndex = 0;
    const hasSup = SUP_REGEX.test(node.value);
    SUP_REGEX.lastIndex = 0;
    if (!hasSub && !hasSup) return;

    const html = node.value
      .replace(SUB_REGEX, "<sub>$1</sub>")
      .replace(SUP_REGEX, "<sup>$1</sup>");

    Object.assign(node, { type: "html", value: html });
  });
};

const MENTION_REGEX = /\B@([a-zA-Z0-9_]{1,30})/g;

export const remarkMentions: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node: Text, index, parent) => {
    if (!parent || typeof index !== "number") return;
    if (!MENTION_REGEX.test(node.value)) return;
    MENTION_REGEX.lastIndex = 0;

    const parts: (Text | Link)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = MENTION_REGEX.exec(node.value))) {
      const mention = match[1];
      if (match.index > lastIndex) {
        parts.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
      }
      parts.push({
        type: "link",
        url: `/u/${mention}`,
        title: null,
        children: [{ type: "text", value: `@${mention}` }],
      });
      lastIndex = match.index + mention.length + 1;
    }

    if (lastIndex < node.value.length) {
      parts.push({ type: "text", value: node.value.slice(lastIndex) });
    }

    (parent as Parent).children.splice(index, 1, ...parts);
  });
};