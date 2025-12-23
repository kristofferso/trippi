import * as React from "react";

import type { Post, Group, GroupMember } from "@/db/schema";

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

import { getBaseUrl } from "@/lib/base-url";
import { createEmailLinkToken } from "@/lib/email-link-token";

export type PostWithAuthor = Post & {
  author?: Pick<GroupMember, "displayName"> | null;
};

function truncate(input: string, max = 140) {
  const s = input.trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function getPreviewImage(post: Post) {
  const media = (post.media ?? []) as {
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
  }[];

  if (!media.length) return null;

  const first = media[0];
  if (first.type === "image") return first.url;
  if (first.type === "video") return first.thumbnailUrl ?? null;
  return null;
}

export function renderNewPostsEmail(args: {
  group: Pick<Group, "id" | "name" | "slug">;
  recipient: Pick<GroupMember, "id" | "displayName">;
  posts: PostWithAuthor[];
}) {
  const baseUrl = getBaseUrl();
  const logoUrl = `${baseUrl}/trippi.png`;
  const token = createEmailLinkToken({
    memberId: args.recipient.id,
    groupId: args.group.id,
  });

  const authed = (redirectPath: string) =>
    `${baseUrl}/api/email/link?token=${encodeURIComponent(
      token
    )}&redirect=${encodeURIComponent(redirectPath)}`;

  const groupPath = `/g/${encodeURIComponent(args.group.slug)}`;
  const groupUrl = authed(groupPath);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(
    token
  )}&redirect=${encodeURIComponent(groupPath)}`;

  const subject =
    args.posts.length === 1
      ? `${args.group.name} — 1 new post`
      : `${args.group.name} — ${args.posts.length} new posts`;

  const react = (
    <NewPostsEmail
      groupName={args.group.name}
      groupUrl={groupUrl}
      logoUrl={logoUrl}
      unsubscribeUrl={unsubscribeUrl}
      posts={args.posts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        url: authed(`${groupPath}/post/${encodeURIComponent(p.id)}`),
        authorName: p.author?.displayName ?? null,
        previewImageUrl: getPreviewImage(p),
      }))}
    />
  );

  return { subject, react };
}

export function NewPostsEmail(props: {
  groupName: string;
  groupUrl: string;
  logoUrl: string;
  unsubscribeUrl: string;
  posts: {
    id: string;
    title: string | null;
    body: string | null;
    url: string;
    authorName: string | null;
    previewImageUrl: string | null;
  }[];
}) {
  const preview =
    props.posts.length === 1
      ? `${props.groupName} — 1 new post`
      : `${props.groupName} — ${props.posts.length} new posts`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={base.body}>
        <Container style={base.container}>
          <Section style={base.header}>
            <Row>
              <Column>
                <Img
                  src={props.logoUrl}
                  width="40"
                  height="40"
                  alt="Trippy"
                  style={base.logo}
                />
              </Column>
              <Column align="right">
                <Button href={props.groupUrl} style={base.groupButton}>
                  Go to group
                </Button>
              </Column>
            </Row>
            <Text style={base.kicker}>Trippy update</Text>
            <Heading style={base.h1}>{props.groupName}</Heading>
            <Text style={base.subhead}>
              {props.posts.length === 1
                ? "1 new post in the last 3 days."
                : `${props.posts.length} new posts in the last 3 days.`}
            </Text>
          </Section>

          {props.posts.map((p) => {
            const postUrl = p.url;
            const title = p.title?.trim() ? p.title.trim() : "New post";
            const snippet = p.body?.trim() ? truncate(p.body, 160) : "";
            const by = p.authorName ? ` by ${p.authorName}` : "";

            return (
              <Section key={p.id} style={base.item}>
                <Hr style={base.hr} />

                <Row>
                  {p.previewImageUrl ? (
                    <Column style={base.thumbCol}>
                      <Link href={postUrl} style={base.link}>
                        <Img
                          src={p.previewImageUrl}
                          alt=""
                          width="96"
                          height="96"
                          style={base.thumb}
                        />
                      </Link>
                    </Column>
                  ) : null}
                  <Column>
                    <Heading as="h3" style={base.h3}>
                      <Link href={postUrl} style={base.titleLink}>
                        {title}
                      </Link>
                    </Heading>
                    <Text style={base.meta}>{by}</Text>
                    {snippet ? (
                      <Text style={base.snippet}>{snippet}</Text>
                    ) : null}

                    <Text style={base.spacer} />
                    <Link href={postUrl} style={base.cta}>
                      Open post →
                    </Link>
                  </Column>
                </Row>
              </Section>
            );
          })}

          <Hr style={base.hrFooter} />
          <Section style={base.footer}>
            <Text style={base.footerText}>
              Don’t want these emails?{" "}
              <Link href={props.unsubscribeUrl} style={base.cta}>
                Unsubscribe
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const base: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    backgroundColor: "#ffffff",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111111",
  },
  container: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "24px 24px 10px",
  },
  header: { paddingBottom: 6 },
  logo: { display: "block", margin: "0 0 10px" },
  groupButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 12,
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 10,
    display: "inline-block",
  },
  kicker: { fontSize: 12, color: "#666666", margin: "0 0 8px" },
  h1: { fontSize: 18, fontWeight: 700, margin: "0 0 6px" },
  subhead: { fontSize: 14, color: "#444444", margin: "0 0 10px" },
  hr: { borderColor: "#eeeeee", margin: "14px 0" },
  hrFooter: { borderColor: "#eeeeee", margin: "22px 0 12px" },
  item: { padding: "0 0 14px" },
  thumbCol: { width: 108, paddingRight: 12, verticalAlign: "top" },
  thumb: {
    display: "block",
    width: 96,
    height: 96,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid #eeeeee",
  },
  h3: { fontSize: 15, fontWeight: 600, lineHeight: "1.3", margin: "0 0 6px" },
  meta: { fontSize: 13, color: "#666666", margin: "0 0 8px" },
  snippet: { fontSize: 14, color: "#333333", lineHeight: "1.5", margin: 0 },
  spacer: { margin: "10px 0 0" },
  link: { textDecoration: "none" },
  titleLink: { color: "#111111", textDecoration: "none" },
  cta: { fontSize: 14, color: "#2563eb", textDecoration: "none" },
  footer: { paddingBottom: 10 },
  footerText: { fontSize: 12, color: "#666666", lineHeight: "1.5", margin: 0 },
};
