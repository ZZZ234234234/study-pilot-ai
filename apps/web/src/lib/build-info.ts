import { GITHUB_URL } from "./config";

export const PRODUCT_NAME = "StudyPilot AI";
export const RELEASE_VERSION = "1.0.1";
export const BUILD_VERSION =
  process.env.NEXT_PUBLIC_STUDYPILOT_VERSION?.trim() ||
  `${RELEASE_VERSION}-dev`;
export const BUILD_COMMIT =
  process.env.NEXT_PUBLIC_STUDYPILOT_COMMIT?.trim() || "";
export const OFFICIAL_REPOSITORY = GITHUB_URL.replace(/\/$/, "");
export const OFFICIAL_REPOSITORY_SLUG = "ZZZ234234234/study-pilot-ai";
export const RELEASES_URL = `${OFFICIAL_REPOSITORY}/releases`;
export const INSTALLER_NAME = `StudyPilot-AI-${RELEASE_VERSION}-Windows-x64-Setup.exe`;
export const CHECKSUM_COMMAND = `certutil -hashfile "${INSTALLER_NAME}" SHA256`;
export const ATTESTATION_COMMAND = `gh attestation verify "${INSTALLER_NAME}" -R ${OFFICIAL_REPOSITORY_SLUG}`;

export const isOfficialWorkflowBuild = /^[a-f0-9]{40}$/i.test(BUILD_COMMIT);
