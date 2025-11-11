import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "../utils/firebase";
import api from "../external-api/requests";
import TitleBadge from "../components/UserCard.tsx/TitleBadge";
import { toaster } from "../components/chakra/ui/toaster";
import { useUserStore } from "../state/store";
import type { TUser, TUserTitle } from "../types/user";

const DEFAULT_BG = "#1f1f24";
const DEFAULT_BORDER = "#37373f";
const DEFAULT_TEXT = "#f2f2f7";

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const globalUser = useUserStore((s) => s.globalUser);
  const globalLoggedIn = useUserStore((s) => s.globalLoggedIn);
  const [titleDraft, setTitleDraft] = useState("");
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [availableFlairs, setAvailableFlairs] = useState<TUserTitle[]>([]);
  const [flairsLoading, setFlairsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Partial<TUser>[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Partial<TUser> | null>(null);
  const [selectedFlair, setSelectedFlair] = useState<TUserTitle | null>(null);
  const [assigning, setAssigning] = useState(false);

  const isAdmin = globalUser?.role === "admin";
  const previewTitle = useMemo<TUserTitle>(
    () => ({
      title: titleDraft.trim() || "Sample Flair",
      bgColor,
      border: borderColor,
      color: textColor,
    }),
    [titleDraft, bgColor, borderColor, textColor]
  );

  useEffect(() => {
    if (!auth.currentUser || !globalUser) {
      setAvailableFlairs([]);
      setFlairsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setFlairsLoading(true);
      try {
        const data = await api.getAllTitles(auth, globalUser.uid);
        if (cancelled) return;
        if (
          data &&
          typeof data === "object" &&
          Array.isArray((data as any).titleData?.titles)
        ) {
          setAvailableFlairs((data as any).titleData.titles as TUserTitle[]);
        } else {
          setAvailableFlairs([]);
        }
      } catch (error) {
        console.error("Failed to load title flairs", error);
      } finally {
        if (!cancelled) {
          setFlairsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [globalUser?.uid]);

  useEffect(() => {
    if (!selectedFlair && availableFlairs.length) {
      setSelectedFlair(availableFlairs[0]);
    }
  }, [availableFlairs, selectedFlair]);

  const handleSearch = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchError("Enter a name or UID to begin searching.");
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await api.searchUsers(auth, trimmed, null, 25);
      const users = response?.users ?? [];
      setSearchResults(users);
      if (!users.length) {
        setSearchError("No users found that match that query.");
      }
    } catch (error) {
      console.error("Admin search failed", error);
      setSearchError("Unable to search right now.");
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm]);

  const handleCreateFlair = useCallback(async () => {
    if (!auth.currentUser) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      toaster.create({
        title: "Title required",
        description: "Give the new flair a name before saving.",
      });
      return;
    }
    setCreating(true);
    const payload: TUserTitle = {
      title: trimmed,
      bgColor,
      border: borderColor,
      color: textColor,
    };
    try {
      const response = await api.createTitleFlair(auth, payload);
      const createdFlair =
        response &&
        typeof response === "object" &&
        typeof (response as TUserTitle).title === "string"
          ? (response as TUserTitle)
          : payload;
      setAvailableFlairs((prev) => [createdFlair, ...prev]);
      setSelectedFlair(createdFlair);
      toaster.create({
        title: "Flair created",
        description: `${createdFlair.title} is available for assignment.`,
      });
      setTitleDraft("");
    } catch (error) {
      console.error("Failed to create flair", error);
      toaster.create({
        title: "Creation failed",
        description: "Please try again shortly.",
      });
    } finally {
      setCreating(false);
    }
  }, [titleDraft, bgColor, borderColor, textColor]);

  const handleAssignFlair = useCallback(async () => {
    if (!auth.currentUser || !selectedUser?.uid || !selectedFlair) return;
    setAssigning(true);
    try {
      const response = await api.assignTitleFlair(
        auth,
        selectedUser.uid,
        selectedFlair
      );
      if (response) {
        toaster.create({
          title: "Flair assigned",
          description: `${selectedFlair.title} is now tied to ${
            selectedUser.userName ?? selectedUser.uid
          }.`,
        });
      } else {
        throw new Error("Server rejected assignment");
      }
    } catch (error) {
      console.error("Failed to assign flair", error);
      toaster.create({
        title: "Assignment failed",
        description: "Please try again soon.",
      });
    } finally {
      setAssigning(false);
    }
  }, [selectedUser, selectedFlair]);

  if (!globalLoggedIn || !auth.currentUser) {
    return (
      <Stack gap={4} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <Heading size="lg">Admin tools</Heading>
        <Text color="gray.400">
          Sign in as an admin to manage title flairs and experiments.
        </Text>
        <Button onClick={() => navigate({ to: "/" })}>Sign in</Button>
      </Stack>
    );
  }

  if (globalLoggedIn && !globalUser) {
    return (
      <Stack gap={4} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <Heading size="lg">Admin tools</Heading>
        <Spinner />
        <Text color="gray.400">Loading your account details.</Text>
      </Stack>
    );
  }

  if (!isAdmin) {
    return (
      <Stack gap={4} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <Heading size="lg">Admin tools</Heading>
        <Text color="gray.400">
          You need admin privileges to view this page.
        </Text>
        <Button onClick={() => navigate({ to: "/home" })}>
          Back to dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={6} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
      <Stack gap={2}>
        <Heading size="lg">Admin Panel</Heading>
        <Text color="gray.400" maxW="2xl">
          Create new title flairs, preview them live, and assign them to players
          for events or special appearances.
        </Text>
      </Stack>

      <Box
        bg="gray.900"
        borderWidth="1px"
        borderColor="gray.800"
        borderRadius="lg"
        p="5"
      >
        <Stack gap={4}>
          <Heading size="md">Create title flair</Heading>
          <Stack
            direction={{ base: "column", md: "row" }}
            gap={3}
            align="flex-end"
          >
            <Box flex="1">
              <Text fontSize="sm" color="gray.400" mb="1">
                Flair name
              </Text>
              <Input
                placeholder="Event champion"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
              />
            </Box>
            <Stack direction="column" gap={2}>
              <Text fontSize="sm" color="gray.400">
                Background
              </Text>
              <Input
                type="color"
                value={bgColor}
                onChange={(event) => setBgColor(event.target.value)}
                maxW="120px"
              />
            </Stack>
            <Stack direction="column" gap={2}>
              <Text fontSize="sm" color="gray.400">
                Text
              </Text>
              <Input
                type="color"
                value={textColor}
                onChange={(event) => setTextColor(event.target.value)}
                maxW="120px"
              />
            </Stack>
            <Stack direction="column" gap={2}>
              <Text fontSize="sm" color="gray.400">
                Border
              </Text>
              <Input
                type="color"
                value={borderColor}
                onChange={(event) => setBorderColor(event.target.value)}
                maxW="120px"
              />
            </Stack>
                        <Button
                            colorPalette="orange"
                            onClick={handleCreateFlair}
                            loading={creating}
                            minW="160px"
                        >
              Create flair
            </Button>
          </Stack>
          <Stack gap={3}>
            <Text fontSize="sm" color="gray.400">
              Preview
            </Text>
            <Box
              px="3"
              py="2"
              borderWidth="1px"
              borderColor="gray.800"
              borderRadius="lg"
              display="inline-flex"
            >
              <TitleBadge title={previewTitle} />
            </Box>
          </Stack>
        </Stack>
      </Box>

                    <Box height="1px" bg="gray.800" width="full" />

      <Box
        bg="gray.900"
        borderWidth="1px"
        borderColor="gray.800"
        borderRadius="lg"
        p="5"
      >
        <Stack gap={4}>
          <Heading size="md">Assign flair to player</Heading>
          <Stack gap={3} direction={{ base: "column", md: "row" }}>
            <Box flex="1">
              <Text fontSize="sm" color="gray.400" mb="1">
                Search players
              </Text>
              <Flex gap={2}>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name or UID"
                />
                                <Button
                                    colorPalette="orange"
                                    onClick={handleSearch}
                                    loading={searchLoading}
                                >
                  Search
                </Button>
              </Flex>
              {searchError ? (
                <Text mt="2" fontSize="xs" color="red.300">
                  {searchError}
                </Text>
              ) : null}
            </Box>
            <Stack flex="1" gap={2}>
              <Text fontSize="sm" color="gray.400">
                Selected player
              </Text>
              {selectedUser ? (
                <Box
                  borderWidth="1px"
                  borderColor="gray.700"
                  borderRadius="md"
                  p="3"
                >
                  <Text>{selectedUser.userName ?? selectedUser.uid}</Text>
                  <Text fontSize="xs" color="gray.500">
                    UID: {selectedUser.uid}
                  </Text>
                  <TitleBadge title={selectedUser.userTitle} />
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Pick a player from the search results.
                </Text>
              )}
            </Stack>
          </Stack>
          <Stack gap={3}>
            {searchLoading ? (
              <Flex justify="center" py="4">
                <Spinner />
              </Flex>
            ) : (
              <Stack gap={2}>
                {searchResults.map((user, index) => {
                  const userId =
                    user.uid ??
                    user.userEmail ??
                    user.userName ??
                    `search-result-${index}`;
                  return (
                    <Button
                      key={userId}
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                      justifyContent="space-between"
                      size="sm"
                    >
                      <Box textAlign="left">
                        <Text fontWeight="semibold">
                          {user.userName || user.uid}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          UID: {user.uid}
                        </Text>
                      </Box>
                      <TitleBadge title={user.userTitle} />
                    </Button>
                  );
                })}
              </Stack>
            )}
          </Stack>
                    <Box height="1px" bg="gray.800" width="full" />
          <Stack gap={3}>
            <Text fontSize="sm" color="gray.400">
              Available flairs
            </Text>
            {flairsLoading ? (
              <Flex justify="center" py="4">
                <Spinner />
              </Flex>
            ) : availableFlairs.length ? (
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="3">
                {availableFlairs.map((flair, index) => {
                  const isActive =
                    selectedFlair?.title === flair.title &&
                    selectedFlair?.bgColor === flair.bgColor &&
                    selectedFlair?.color === flair.color &&
                    selectedFlair?.border === flair.border;
                  return (
                    <Box
                      key={`${flair.title}-${index}`}
                      borderWidth="1px"
                      borderColor={isActive ? "orange.400" : "gray.700"}
                      borderRadius="lg"
                      p="3"
                      cursor="pointer"
                      onClick={() => setSelectedFlair(flair)}
                      transition="border-color 0.2s"
                    >
                      <TitleBadge title={flair} />
                      <Text fontSize="xs" color="gray.500" mt="2">
                        {flair.title}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="gray.500">
                No available flairs yet. Create one to begin assigning.
              </Text>
            )}
          </Stack>
                    <Button
                        colorPalette="orange"
                        disabled={!selectedUser || !selectedFlair}
                        onClick={handleAssignFlair}
                        loading={assigning}
                    >
            Assign flair
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
