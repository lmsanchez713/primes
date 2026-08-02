cmake_minimum_required(VERSION 3.10)

project(
  WILL
  VERSION 1.0
  LANGUAGES CXX)
  
# If you set any CMAKE_ variables, that can go here.
# (But usually don't do this, except maybe for C++ standard)

# Find packages go here.
find_package(SDL2 CONFIG REQUIRED)
find_package(SDL2_image CONFIG REQUIRED)

#add_library(MyLibExample simple_lib.cpp simple_lib.hpp)

# Link each target with other targets or add options, etc.

#include_directories(cpp17/include)

# Adding something we can run - Output name matches target name
#add_executable(tarsus tarsus.cxx "llm.ixx" "yaml.ixx" "tests.ixx")
add_executable(will will.cxx)
#"projetos/tarsus/windows/linmath.h"

#target_include_directories(tarsus PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/projetos/tarsus/windows/lm)

set_property(TARGET will PROPERTY CXX_STANDARD 17)

target_compile_definitions(will PRIVATE WINDOWS_BUILD)

# Link libraries go here.
target_link_libraries(will PRIVATE SDL2::SDL2 SDL2::SDL2main)
target_link_libraries(will PRIVATE $<IF:$<TARGET_EXISTS:SDL2_image::SDL2_image>,SDL2_image::SDL2_image,SDL2_image::SDL2_image-static>)

# Include directories go here.
